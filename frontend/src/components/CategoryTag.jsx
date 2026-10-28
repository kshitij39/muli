import { CATEGORIES } from '../places.js'

function CategoryTag({ category }) {
  return (
    <span className="tag inline-flex items-center gap-1.5 border-stone-200 bg-stone-50 text-stone-700">
      <span className="mark" style={{ background: CATEGORIES[category].color }} />
      {CATEGORIES[category].name}
    </span>
  )
}

export default CategoryTag
