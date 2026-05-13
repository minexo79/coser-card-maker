import { useState } from "react";

export default function DropdownMenu({ templates }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      {/* Menu Button */}
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-md hover:bg-gray-200">
        <span class="text-base text-gray-800">切換活動</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-60 bg-white border border-gray-200 rounded-md shadow-lg z-10">
          {/* List of templates */}
          {Object.entries(templates).map(([key, template]) => (
            <button
              key={key}
              onClick={() => {
                window.location.href = `/${key}`;
              }}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              {template.displayName || key}
            </button>
          ))}
          {/* Back to Home */}
          <button
            onClick={() => {
              window.location.href = `/`;
            }}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            回首頁
          </button>
        </div>
      )}
    </div>
  );
}