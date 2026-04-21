import AppButton from '@/app/(view)/component_shared/AppButton';

export default function FilterButton({ active, activeClassName, inactiveClassName, onClick, children }) {
  return (
    <AppButton
      onClick={onClick}
      className={`!rounded-lg !px-4 !py-2 !h-10 !shadow-none ${active ? activeClassName : inactiveClassName}`}
    >
      {children}
    </AppButton>
  );
}
