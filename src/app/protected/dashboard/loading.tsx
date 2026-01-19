import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export default function Loading() {
  return (
    <div className="p-8 bg-gradient-to-br from-purple-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <Skeleton height={40} width={300} className="mb-8" />
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow">
              <Skeleton height={20} width={150} className="mb-2" />
              <Skeleton height={36} width={100} />
            </div>
          ))}
        </div>
        
        {/* Charts/Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow">
              <Skeleton height={24} width={200} className="mb-4" />
              <Skeleton height={300} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
