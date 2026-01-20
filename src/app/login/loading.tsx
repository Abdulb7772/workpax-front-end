import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-r from-green-400 via-blue-500 to-purple-600">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md">
        <div className="mb-8">
          <Skeleton height={32} width={200} className="mb-2" />
          <Skeleton height={20} width={250} />
        </div>
        <div className="space-y-4">
          <div>
            <Skeleton height={16} width={80} className="mb-2" />
            <Skeleton height={40} />
          </div>
          <div>
            <Skeleton height={16} width={80} className="mb-2" />
            <Skeleton height={40} />
          </div>
          <Skeleton height={48} className="mt-6" />
          <Skeleton height={20} width={150} className="mx-auto" />
        </div>
      </div>
    </div>
  );
}
