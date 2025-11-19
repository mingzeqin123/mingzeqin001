'use strict';

/**
 * 用户图片清理脚本
 * - 按修改时间倒序输出最新图片列表
 * - 保留最新 N 张图片，定时清理其余文件
 *
 * 环境变量：
 *  USER_IMAGE_DIR        目标图片目录（默认：项目根目录下 images/user-generated）
 *  MAX_USER_IMAGES       需要保留的最大图片数量（默认：20）
 *  CLEANUP_INTERVAL_MIN  清理任务执行间隔，单位：分钟（默认：5）
 *
 * 运行示例：
 *  node scripts/cleanup-user-images.js        # 启动定时清理
 *  node scripts/cleanup-user-images.js --once # 只执行一次清理
 */

const fs = require('fs/promises');
const path = require('path');

const IMAGE_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.bmp',
  '.webp',
  '.avif',
  '.heic'
]);

const MAX_IMAGES = Number.parseInt(process.env.MAX_USER_IMAGES ?? '20', 10);
const CLEANUP_INTERVAL_MIN = Math.max(
  1,
  Number.parseInt(process.env.CLEANUP_INTERVAL_MIN ?? '5', 10)
);
const IMAGE_DIR = process.env.USER_IMAGE_DIR
  ? path.resolve(process.env.USER_IMAGE_DIR)
  : path.join(__dirname, '..', 'images', 'user-generated');

const RUN_ONCE = process.argv.includes('--once');

async function ensureDirectory(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function readImageFiles(dirPath) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const files = [];

  await Promise.all(
    entries.map(async (entry) => {
      if (!entry.isFile()) {
        return;
      }

      const ext = path.extname(entry.name).toLowerCase();
      if (!IMAGE_EXTENSIONS.has(ext)) {
        return;
      }

      const fullPath = path.join(dirPath, entry.name);
      const stats = await fs.stat(fullPath);

      files.push({
        filePath: fullPath,
        fileName: entry.name,
        mtimeMs: stats.mtimeMs,
        birthtimeMs: stats.birthtimeMs
      });
    })
  );

  files.sort((a, b) => {
    if (b.mtimeMs === a.mtimeMs) {
      return b.birthtimeMs - a.birthtimeMs;
    }
    return b.mtimeMs - a.mtimeMs;
  });

  return files;
}

function logCurrentOrder(files) {
  if (files.length === 0) {
    console.log('[ImageCleanup] 当前目录没有可管理的图片。');
    return;
  }

  console.log('[ImageCleanup] 当前图片列表（最新在前）:');
  files.forEach((file, index) => {
    const timestamp = new Date(file.mtimeMs).toISOString();
    console.log(`  ${index + 1}. ${file.fileName}  ${timestamp}`);
  });
}

async function deleteExcessFiles(files) {
  if (files.length <= MAX_IMAGES) {
    console.log(
      `[ImageCleanup] 图片数量 ${files.length} 未超过阈值 ${MAX_IMAGES}，无需删除。`
    );
    return;
  }

  const toDelete = files.slice(MAX_IMAGES);
  for (const file of toDelete) {
    try {
      await fs.unlink(file.filePath);
      console.log(`[ImageCleanup] 已删除旧图片：${file.fileName}`);
    } catch (error) {
      console.error(`[ImageCleanup] 删除 ${file.fileName} 失败：`, error.message);
    }
  }
}

async function runCleanup() {
  await ensureDirectory(IMAGE_DIR);
  const files = await readImageFiles(IMAGE_DIR);
  logCurrentOrder(files);
  await deleteExcessFiles(files);
}

async function main() {
  console.log(`[ImageCleanup] 监控目录：${IMAGE_DIR}`);
  console.log(`[ImageCleanup] 保留最新 ${MAX_IMAGES} 张图片。`);

  await runCleanup();

  if (RUN_ONCE) {
    return;
  }

  const intervalMs = CLEANUP_INTERVAL_MIN * 60 * 1000;
  console.log(
    `[ImageCleanup] 定时清理已启动，每 ${CLEANUP_INTERVAL_MIN} 分钟执行一次。`
  );

  setInterval(() => {
    runCleanup().catch((error) => {
      console.error('[ImageCleanup] 定时清理任务失败：', error);
    });
  }, intervalMs);
}

main().catch((error) => {
  console.error('[ImageCleanup] 脚本执行失败：', error);
  process.exitCode = 1;
});
