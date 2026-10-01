import { useState } from 'react';
import { validateXHandle } from '../lib/validation';

export function PersonSearch() {
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');

  return (
    <search className="w-full max-w-2xl">
      <form
        className="flex flex-col gap-3 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          const result = validateXHandle(query);
          if (!result.valid) {
            setMessage(result.error);
            return;
          }
          if (result.value !== 'demo') {
            setMessage('当前静态演示仅包含 @demo 档案。');
            return;
          }
          window.location.assign(`/@${result.value}`);
        }}
      >
        <label className="sr-only" htmlFor="person-search">
          搜索公开 X 用户
        </label>
        <input
          autoComplete="off"
          className="min-h-13 min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 text-base shadow-sm placeholder:text-slate-400"
          id="person-search"
          onChange={(event) => {
            setQuery(event.currentTarget.value);
            setMessage('');
          }}
          placeholder="输入 X 用户名，例如 @demo"
          value={query}
        />
        <button
          className="min-h-13 rounded-xl bg-slate-900 px-6 font-semibold text-white transition-colors hover:bg-slate-700"
          type="submit"
        >
          搜索
        </button>
      </form>
      <p aria-live="polite" className="mt-2 min-h-6 text-sm text-slate-600">
        {message || '无需登录即可浏览公开记录。当前页面使用演示档案。'}
      </p>
    </search>
  );
}
