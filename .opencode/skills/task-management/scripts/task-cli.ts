import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

function findProjectRoot() {
  let dir = process.cwd();
  while (dir !== path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, '.git')) || fs.existsSync(path.join(dir, 'package.json'))) {
      return dir;
    }
    dir = path.dirname(dir);
  }
  return process.cwd();
}

const PROJECT_ROOT = findProjectRoot();
const TASKS_DIR = path.join(PROJECT_ROOT, '.tmp', 'tasks');

function getFeatureDirs() {
  if (!fs.existsSync(TASKS_DIR)) return [];
  return fs.readdirSync(TASKS_DIR).filter((f) => {
    const fullPath = path.join(TASKS_DIR, f);
    return fs.statSync(fullPath).isDirectory() && f !== 'completed';
  });
}

function loadTask(feature) {
  const taskPath = path.join(TASKS_DIR, feature, 'task.json');
  if (!fs.existsSync(taskPath)) return null;
  return JSON.parse(fs.readFileSync(taskPath, 'utf-8'));
}

function loadSubtasks(feature) {
  const featureDir = path.join(TASKS_DIR, feature);
  if (!fs.existsSync(featureDir)) return [];
  const files = fs.readdirSync(featureDir).filter((f) => f.match(/^subtask_\d{2}\.json$/)).sort();
  return files.map((f) => JSON.parse(fs.readFileSync(path.join(featureDir, f), 'utf-8')));
}

function saveSubtask(feature, subtask) {
  fs.writeFileSync(path.join(TASKS_DIR, feature, `subtask_${subtask.seq}.json`), JSON.stringify(subtask, null, 2));
}

function saveTask(feature, task) {
  fs.writeFileSync(path.join(TASKS_DIR, feature, 'task.json'), JSON.stringify(task, null, 2));
}

function cmdStatus(feature) {
  const features = feature ? [feature] : getFeatureDirs();
  if (features.length === 0) { console.log('No active features found.'); return; }
  for (const f of features) {
    const task = loadTask(f);
    const subtasks = loadSubtasks(f);
    if (!task) { console.log(`\n[${f}] - No task.json found`); continue; }
    const counts = { pending: 0, in_progress: 0, completed: 0, blocked: 0 };
    subtasks.forEach(s => counts[s.status]++);
    const progress = subtasks.length > 0 ? Math.round((counts.completed / subtasks.length) * 100) : 0;
    console.log(`\n[${f}] ${task.name}`);
    console.log(`  Status: ${task.status} | Progress: ${progress}% (${counts.completed}/${subtasks.length})`);
    console.log(`  Pending: ${counts.pending} | In Progress: ${counts.in_progress} | Completed: ${counts.completed} | Blocked: ${counts.blocked}`);
  }
}

function cmdNext(feature) {
  const features = feature ? [feature] : getFeatureDirs();
  console.log('\n=== Ready Tasks (deps satisfied) ===\n');
  for (const f of features) {
    const subtasks = loadSubtasks(f);
    const completedSeqs = new Set(subtasks.filter(s => s.status === 'completed').map(s => s.seq));
    const ready = subtasks.filter(s => {
      if (s.status !== 'pending') return false;
      return s.depends_on.every(dep => completedSeqs.has(dep));
    });
    if (ready.length > 0) {
      console.log(`[${f}]`);
      ready.forEach(s => {
        const parallel = s.parallel ? '[parallel]' : '[sequential]';
        console.log(`  ${s.seq} - ${s.title}  ${parallel}`);
      });
      console.log();
    }
  }
}

function cmdComplete(feature, seq, summary) {
  if (summary.length > 200) { console.log('Error: Summary must be max 200 characters'); process.exit(1); }
  const subtasks = loadSubtasks(feature);
  const subtask = subtasks.find(s => s.seq === seq);
  if (!subtask) { console.log(`Task ${seq} not found in ${feature}`); process.exit(1); }
  subtask.status = 'completed';
  subtask.completed_at = new Date().toISOString();
  subtask.completion_summary = summary;
  saveSubtask(feature, subtask);
  const task = loadTask(feature);
  if (task) {
    const newSubtasks = loadSubtasks(feature);
    task.completed_count = newSubtasks.filter(s => s.status === 'completed').length;
    saveTask(feature, task);
  }
  console.log(`\n✓ Marked ${feature}/${seq} as completed`);
  console.log(`  Summary: ${summary}`);
  if (task) console.log(`  Progress: ${task.completed_count}/${task.subtask_count}`);
}

const [,, command, ...args] = process.argv;
switch (command) {
  case 'status': cmdStatus(args[0]); break;
  case 'next': cmdNext(args[0]); break;
  case 'complete':
    if (args.length < 3) { console.log('Usage: complete <feature> <seq> "summary"'); process.exit(1); }
    cmdComplete(args[0], args[1], args.slice(2).join(' '));
    break;
  default:
    console.log('Task Management CLI\nCommands: status, next, complete <feature> <seq> <summary>');
}
