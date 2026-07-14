import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import api from '../services/api';

const resolvePath = (object, path) => {
  return path.split('.').reduce((o, p) => (o ? o[p] : null), object);
};

const GenericListPage = ({ title, endpoint, columns }) => {
  const { data, isLoading } = useQuery({
    queryKey: [endpoint],
    queryFn: async () => {
      const res = await api.get(endpoint);
      return res.data.data;
    }
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-secondary mb-2">{title}</h1>
          <p className="text-gray-500">View and manage all records in this module.</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
             <div className="animate-pulse space-y-4 p-6">
               {[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-gray-50 rounded" />)}
             </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                  <tr>
                    {columns.map(c => <th key={c.key} className="px-6 py-4 font-semibold">{c.label}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data?.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      {columns.map(c => {
                         const rawValue = resolvePath(item, c.key);
                         return (
                           <td key={c.key} className="px-6 py-4 text-gray-700">
                             {c.render ? c.render(item, rawValue) : (rawValue || '-')}
                           </td>
                         );
                      })}
                    </tr>
                  ))}
                  {(!data || data.length === 0) && (
                    <tr>
                      <td colSpan={columns.length} className="text-center py-12 text-gray-400">
                        No records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GenericListPage;
