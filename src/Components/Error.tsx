import { Link } from "react-router"

export default function ErrorPage() {
    return (
        <div>
            <h1>An unexpected error has occurred</h1>
            <p>Please try again later.</p>
            <Link to="/">Go back to Home</Link>
        </div>
    )
}