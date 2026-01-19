import Link from "next/link";

export default function HomePage() {
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-10 py-4 bg-linear-to-br from-red-950 via-red-900 to-red-950">
        {/* Left */}
        <h1 className="text-3xl font-bold text-gray-400 whitespace-nowrap">
          Welcome to workpax
        </h1>

        {/* Right */}
        <div className="flex items-center gap-6">
          <div className="flex gap-4">
            <p className="mt-3 text-sm text-gray-400 whitespace-nowrap text-center">
            Don't have an account? 
          </p>
            <Link href="/signup">
              <button className="px-3 py-2 bg-blue-300 text-black rounded-xl font-semibold hover:bg-gray-200 transition shadow-lg">
                Sign Up
              </button>
            </Link>
          <p className="mt-3 text-sm  text-gray-400 whitespace-nowrap text-center">
            Already have an account? 
          </p>
              <Link href="/login">
              <button className="px-3 py-2 bg-transparent  text-white rounded-xl font-semibold border border-white/50 hover:bg-gray-100 hover:text-black transition shadow-lg">
                Login
              </button>
            </Link>
          
            

            
          </div>
        </div>
      </div>

      {/* Hero Section (unchanged) */}
      <div className="h-screen flex flex-col justify-center items-center relative overflow-hidden bg-linear-to-br from-red-950 via-red-800 to-red-950">
        <div className="relative z-10 backdrop-blur-2xl bg-white/10 border border-white/20 rounded-3xl p-16 shadow-2xl max-w-2xl w-full mx-4">
          <h1 className="text-5xl font-bold mb-4 text-white text-center">
            Welcome to Workpax
          </h1>
          <p className="text-xl mb-10 text-white/80 text-center">
            You can login or signup
          </p>
          <div className="flex gap-6 justify-center">
            <Link href="/signup">
              <button className="px-12 py-4 bg-white text-red-950 rounded-2xl font-semibold hover:bg-gray-300 transition shadow-lg">
                Sign Up
              </button>
            </Link>
            <Link href="/login">
              <button className="px-12 py-4 bg-transparent text-white rounded-2xl font-semibold border-2 border-white/50 hover:bg-white/20 transition">
                Login
              </button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
