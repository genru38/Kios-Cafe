interface BrandLogoProps {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md';
}

export function BrandLogo({ variant = 'light', size = 'md' }: BrandLogoProps) {
  const boxSize = size === 'sm' ? 'w-9 h-9' : 'w-10 h-10';
  const textColor = variant === 'dark' ? 'text-white' : 'text-[#111317]';

  return (
    <div className="flex items-center gap-3 shrink-0 select-none">
      <div
        className={`${boxSize} rounded-lg flex items-center justify-center shrink-0 kc-accent-gradient shadow-sm`}
        aria-hidden="true"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Minimalist steaming cup + KIOS geometric emblem */}
          <path
            d="M4 9.5H16.5V15C16.5 17.7614 14.2614 20 11.5 20H9C6.23858 20 4 17.7614 4 15V9.5Z"
            fill="#FFFFFF"
          />
          <path
            d="M16.5 11H18.25C19.4926 11 20.5 12.0074 20.5 13.25C20.5 14.4926 19.4926 15.5 18.25 15.5H16.5"
            stroke="#FFFFFF"
            strokeWidth="2.1"
            strokeLinecap="round"
          />
          <path
            d="M7.5 6.2C7.5 5.1 8.3 4.5 8.3 3.5"
            stroke="#1F2227"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M12.5 6.2C12.5 5.1 13.3 4.5 13.3 3.5"
            stroke="#1F2227"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <span
        className={`font-display font-extrabold tracking-tight whitespace-nowrap shrink-0 ${
          size === 'sm' ? 'text-lg' : 'text-xl'
        } ${textColor}`}
      >
        KIOS CAFE
      </span>
    </div>
  );
}
