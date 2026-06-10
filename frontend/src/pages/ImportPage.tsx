import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const navigate = useNavigate();

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const { data } = await api.post('/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(data);
      toast.success('File uploaded for import');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="card p-6">
        <div className="text-center mb-6">
          <FileSpreadsheet className="w-12 h-12 text-primary-600 mx-auto mb-2" />
          <h2 className="text-lg font-semibold">Import Loans</h2>
          <p className="text-sm text-gray-500">Upload Excel (.xlsx) or CSV file</p>
        </div>

        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            file ? 'border-primary-400 bg-primary-50' : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files[0];
            if (f) setFile(f);
          }}
        >
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            id="file-input"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <label htmlFor="file-input" className="cursor-pointer">
            {file ? (
              <div>
                <p className="font-medium text-primary-700">{file.name}</p>
                <p className="text-sm text-gray-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div>
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Drag & drop or click to browse</p>
              </div>
            )}
          </label>
        </div>

        <button
          className="btn-primary w-full mt-4"
          disabled={!file || uploading}
          onClick={handleUpload}
        >
          {uploading ? 'Uploading...' : 'Upload & Import'}
        </button>
      </div>

      {result && (
        <div className="card p-4 space-y-2">
          <h3 className="font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-blue-500" />
            Import Result
          </h3>
          <p className="text-sm text-gray-600">Job ID: {result.jobId}</p>
          <p className="text-sm text-gray-600">Status: {result.status}</p>
          <p className="text-sm text-gray-500">{result.message}</p>
          <button
            className="btn-ghost text-sm"
            onClick={() => navigate('/loans')}
          >
            View Loans
          </button>
        </div>
      )}

      <div className="card p-4">
        <h3 className="font-medium text-sm mb-2">Expected Columns</h3>
        <ul className="text-xs text-gray-500 space-y-1">
          <li>accountNo, memberName, memberCode, loanCategory</li>
          <li>disburseAmount, principalDue, dueCount, interestTotal</li>
          <li>loanLimit, outstandingAmount, totalDue, mobileNo</li>
          <li>guarantorInfo, loanExpiryDate, status</li>
        </ul>
      </div>
    </div>
  );
}
