export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0f0a10] flex items-center justify-center text-white">
      <div className="text-center">
        <h1 className="text-6xl font-black text-[#E11D48]">404</h1>
        <p className="text-gray-400 mt-2">Page not found</p>
        <a href="/" className="mt-4 inline-block bg-[#E11D48] px-6 py-2 rounded-xl font-bold">
          Go Home
        </a>
      </div>
    </div>
  );
}
