import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export default function Loading() {
  return (
    <div className="min-h-screen bg-linear-to-br from-purple-50 via-blue-50 to-pink-50 p-8">
      <div className="max-w-7xl mx-auto">
        <Skeleton height={40} width={200} className="mb-6" />
        <Skeleton height={50} width={300} className="mb-8" />
        
        <div className="flex gap-6 overflow-x-auto">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="shrink-0 w-80">
              <div className="bg-gray-100 rounded-xl p-4">
                <Skeleton height={32} className="mb-4" />
                <div className="space-y-3">
                  {[1, 2, 3].map((j) => (
                    <Skeleton key={j} height={150} />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
