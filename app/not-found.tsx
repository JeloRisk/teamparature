export default function NotFound() {
    return (
        <div className="flex h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-orange-50 to-blue-100">
            <div className="text-center px-6">
                <h1 className="text-6xl font-extrabold text-blue-600 mb-4">404</h1>
                <p className="text-xl text-orange-600 mb-6">
                    Oops! This page couldn’t be found.
                </p>
                <p className="text-sm text-blue-500">
                    You may not have access, or it might have been deleted or moved.
                </p>
            </div>
        </div>
    )
}
