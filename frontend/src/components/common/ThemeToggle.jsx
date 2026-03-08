import { useTheme } from '../../context/ThemeContext'

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      className="rounded-md bg-accent-500 px-3 py-2 text-xs font-semibold text-white hover:bg-accent-700"
      onClick={toggleTheme}
      type="button"
    >
      {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
    </button>
  )
}

export default ThemeToggle
