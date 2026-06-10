import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import api from '../services/api';
import { MapPin, Calendar } from 'lucide-react';

export default function VisitsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['visits', page],
    queryFn: () => api.get('/visits', { params: { page, limit: 20 } }).then((r) => r.data),
  });

  const statusColors: Record<string, string> = {
    completed: 'bg-green-100 text-green-700',
    'no-contact': 'bg-yellow-100 text-yellow-700',
    refused: 'bg-red-100 text-red-700',
    promise: 'bg-blue-100 text-blue-700',
    scheduled: 'bg-gray-100 text-gray-700',
  };

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : data?.visits?.length === 0 ? (
        <div className="card p-8 text-center text-gray-400">No field visits recorded</div>
      ) : (
        <div className="space-y-3">
          {data?.visits?.map((visit: any) => (
            <div key={visit.id} className="card p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{visit.loan?.memberName}</p>
                  <p className="text-sm text-gray-500">{visit.loan?.accountNo}</p>
                </div>
                <span className={`badge text-xs ${statusColors[visit.status] || 'bg-gray-100'}`}>
                  {visit.status.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="flex gap-3 mt-2 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(visit.visitDate).toLocaleDateString()}
                </span>
                {visit.latitude && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    GPS
                  </span>
                )}
              </div>
              {visit.notes && <p className="text-sm text-gray-600 mt-1">{visit.notes}</p>}
              {visit.paymentCollected > 0 && (
                <p className="text-sm font-medium text-green-600 mt-1">
                  Collected: ₹{visit.paymentCollected.toLocaleString()}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {data?.total > 20 && (
        <div className="flex justify-center gap-2">
          <button className="btn-secondary text-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
          <span className="text-sm text-gray-500 self-center">Page {page}</span>
          <button className="btn-secondary text-sm" disabled={page >= Math.ceil(data.total / 20)} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}
