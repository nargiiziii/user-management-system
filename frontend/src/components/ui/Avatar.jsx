import { getInitials } from '../../utils/helpers'

export default function Avatar({ name='?', color='#6366f1', size='md', className='' }) {
  return (
    <div
      className={`avatar avatar-${size} ${className}`}
      style={{ background: color + '33', color, border: `1.5px solid ${color}55` }}
    >
      {getInitials(name)}
    </div>
  )
}
