import { Link } from 'react-router-dom'

export default function NotFound({ text = 'Такой страницы не существует — возможно, ссылка устарела.' }) {
  return (
    <div className="container not-found">
      <div className="not-found__code">404</div>
      <h1>Страница затерялась в веках</h1>
      <p>{text}</p>
      <Link to="/" className="btn btn--primary">
        На главную
      </Link>
    </div>
  )
}
