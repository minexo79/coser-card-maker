// 共用載入指示：三格依序點亮 + 文字
const Loader = ({ label = '載入中…', className = '' }) => (
  <div role="status" className={`flex items-center justify-center gap-2.5 text-sm text-muted ${className}`}>
    <span className="loader-dots" aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
    {label && <span>{label}</span>}
  </div>
);

// 骨架屏區塊；尺寸與圓角由 className 決定
export const Skeleton = ({ className = '' }) => (
  <div aria-hidden="true" className={`skeleton rounded-lg ${className}`} />
);

export default Loader;
