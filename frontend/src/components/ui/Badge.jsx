export default function Badge({ value, className='' }) {
  if (!value) return null
  return <span className={`badge badge-${value.toLowerCase().replace(' ','_')} ${className}`}>{value}</span>
}
