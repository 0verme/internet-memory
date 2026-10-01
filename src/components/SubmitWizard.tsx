import { type ChangeEvent, useEffect, useState } from 'react';
import {
  MAX_ATTACHMENTS_PER_RECORD,
  MAX_IMAGE_SIZE_BYTES,
  validateDescription,
  validateImageUpload,
  validateXHandle,
  validateXPostUrl,
} from '../lib/validation';

interface LocalImage {
  name: string;
  size: number;
  previewUrl: string;
}

const STEPS = ['账号', '图片', '说明', '预览', '提交'];

function formatSize(size: number): string {
  return `${(size / 1024).toFixed(0)} KB`;
}

export function SubmitWizard() {
  const [step, setStep] = useState(0);
  const [handle, setHandle] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [images, setImages] = useState<LocalImage[]>([]);
  const [description, setDescription] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [occurredAt, setOccurredAt] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(
    () => () =>
      images.forEach((image) => {
        URL.revokeObjectURL(image.previewUrl);
      }),
    [images],
  );

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = '';
    setFiles([]);
    setImages([]);
    setError('');

    if (selectedFiles.length > MAX_ATTACHMENTS_PER_RECORD) {
      setError(`每条记录最多选择 ${MAX_ATTACHMENTS_PER_RECORD} 张图片。`);
      return;
    }

    const localImages: LocalImage[] = [];
    for (const file of selectedFiles) {
      const signature = new Uint8Array(await file.slice(0, 12).arrayBuffer());
      const result = validateImageUpload({
        filename: file.name,
        mimeType: file.type,
        size: file.size,
        signature,
      });
      if (!result.valid) {
        localImages.forEach((image) => {
          URL.revokeObjectURL(image.previewUrl);
        });
        setError(`${file.name}: ${result.error}`);
        return;
      }
      localImages.push({
        name: file.name,
        size: file.size,
        previewUrl: URL.createObjectURL(file),
      });
    }

    setFiles(selectedFiles);
    setImages(localImages);
  }

  function continueStep() {
    setError('');
    setNotice('');

    if (step === 0) {
      const result = validateXHandle(handle);
      if (!result.valid) {
        setError(result.error);
        return;
      }
      setHandle(result.value);
    }
    if (step === 1 && files.length === 0) {
      setError('请至少选择一张公开内容截图。');
      return;
    }
    if (step === 2) {
      const textResult = validateDescription(description);
      if (!textResult.valid) {
        setError(textResult.error);
        return;
      }
      const urlResult = validateXPostUrl(sourceUrl);
      if (!urlResult.valid) {
        setError(urlResult.error);
        return;
      }
      setDescription(textResult.value);
      setSourceUrl(urlResult.value ?? '');
    }
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  }

  function completePreview() {
    setNotice('Phase 0 演示：没有上传图片、登录账号或保存记录。');
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
      <ol aria-label="投稿步骤" className="mb-8 grid grid-cols-5 gap-2">
        {STEPS.map((label, index) => (
          <li
            aria-current={step === index ? 'step' : undefined}
            className={`border-t-2 pt-2 text-xs sm:text-sm ${step === index ? 'border-cyan-700 font-semibold text-slate-900' : 'border-slate-200 text-slate-500'}`}
            key={label}
          >
            {index + 1}. {label}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <div className="space-y-4">
          <div>
            <label className="mb-2 block font-semibold" htmlFor="submit-handle">
              公开 X 用户名
            </label>
            <input
              autoComplete="off"
              className="min-h-12 w-full rounded-lg border border-slate-300 px-3"
              id="submit-handle"
              onChange={(event) => setHandle(event.currentTarget.value)}
              placeholder="@demo"
              value={handle}
            />
          </div>
          <p className="text-sm text-slate-600">仅支持公开账号。当前为静态演示流程。</p>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <label className="block font-semibold" htmlFor="record-images">
            选择公开内容截图
          </label>
          <input
            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            className="block w-full rounded-lg border border-slate-300 p-3 text-sm"
            id="record-images"
            multiple
            onChange={handleFileChange}
            type="file"
          />
          <p className="text-sm text-slate-600">
            JPG、PNG、WebP；每张不超过 {MAX_IMAGE_SIZE_BYTES / 1024 / 1024} MiB，每条最多{' '}
            {MAX_ATTACHMENTS_PER_RECORD} 张。本地预览不会上传文件。
          </p>
          {images.length > 0 && (
            <ul className="grid gap-3 sm:grid-cols-2">
              {images.map((image) => (
                <li
                  className="flex items-center gap-3 rounded-lg bg-slate-50 p-3"
                  key={image.previewUrl}
                >
                  <img
                    alt="本地预览"
                    className="h-14 w-14 rounded-md object-cover"
                    src={image.previewUrl}
                  />
                  <span className="min-w-0 truncate text-sm">
                    {image.name} · {formatSize(image.size)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <div>
            <label className="mb-2 block font-semibold" htmlFor="record-description">
              简短说明
            </label>
            <textarea
              className="min-h-28 w-full rounded-lg border border-slate-300 p-3"
              id="record-description"
              maxLength={500}
              onChange={(event) => setDescription(event.currentTarget.value)}
              value={description}
            />
            <p className="mt-1 text-right text-xs text-slate-500">{description.length}/500</p>
          </div>
          <div>
            <label className="mb-2 block font-semibold" htmlFor="source-url">
              原始 X Post URL（可选）
            </label>
            <input
              className="min-h-12 w-full rounded-lg border border-slate-300 px-3"
              id="source-url"
              inputMode="url"
              onChange={(event) => setSourceUrl(event.currentTarget.value)}
              placeholder="https://x.com/.../status/..."
              value={sourceUrl}
            />
          </div>
          <div>
            <label className="mb-2 block font-semibold" htmlFor="occurred-at">
              内容发生时间（可选）
            </label>
            <input
              className="min-h-12 w-full rounded-lg border border-slate-300 px-3"
              id="occurred-at"
              onChange={(event) => setOccurredAt(event.currentTarget.value)}
              type="datetime-local"
              value={occurredAt}
            />
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">预览记录</h2>
          <p className="text-sm text-slate-700">公开账号：@{handle}</p>
          <p className="whitespace-pre-wrap text-sm text-slate-700">{description}</p>
          {sourceUrl && (
            <a
              className="break-all text-sm text-cyan-800 underline"
              href={sourceUrl}
              rel="noreferrer"
              target="_blank"
            >
              {sourceUrl}
            </a>
          )}
          {occurredAt && <p className="text-sm text-slate-600">发生时间：{occurredAt}</p>}
          <div className="grid gap-3 sm:grid-cols-2">
            {images.map((image) => (
              <img
                alt="所选公开截图预览"
                className="max-h-72 rounded-lg object-contain"
                key={image.previewUrl}
                src={image.previewUrl}
              />
            ))}
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">提交记录</h2>
          <p className="text-sm leading-6 text-slate-600">
            Google OAuth 和投稿 API 尚未接入。真实投稿需要 Google
            登录；本次操作只展示流程，不会向服务器发送或保存数据。
          </p>
          <button
            className="min-h-12 rounded-lg bg-slate-900 px-5 font-semibold text-white hover:bg-slate-700"
            onClick={completePreview}
            type="button"
          >
            完成演示
          </button>
        </div>
      )}

      {error && (
        <p aria-live="polite" className="mt-5 text-sm font-medium text-red-700">
          {error}
        </p>
      )}
      {notice && (
        <p aria-live="polite" className="mt-5 text-sm font-medium text-emerald-800">
          {notice}
        </p>
      )}
      <div className="mt-8 flex justify-between border-t border-slate-100 pt-5">
        <button
          className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={step === 0}
          onClick={() => {
            setError('');
            setNotice('');
            setStep((current) => Math.max(0, current - 1));
          }}
          type="button"
        >
          上一步
        </button>
        {step < 4 && (
          <button
            className="min-h-11 rounded-lg bg-cyan-800 px-5 text-sm font-semibold text-white hover:bg-cyan-900"
            onClick={continueStep}
            type="button"
          >
            {step === 3 ? '确认并继续' : '下一步'}
          </button>
        )}
      </div>
    </section>
  );
}
