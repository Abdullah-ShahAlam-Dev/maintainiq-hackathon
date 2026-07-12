import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';

const PublicAssetPage = () => {
  const { code } = useParams();
  const [asset, setAsset] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get(`/public/asset/${code}`)
      .then((res) => setAsset(res.data))
      .catch(() => setError('Asset not found'));
  }, [code]);

  if (error) return <div className="public-page"><p className="error-text">{error}</p></div>;
  if (!asset) return <div className="public-page"><p>Loading...</p></div>;

  return (
    <div className="public-page">
      <div className="public-card">
        <h1>{asset.name}</h1>
        <p className="asset-code">{asset.assetCode}</p>
        <span className={`status-badge status-${asset.status.replace(/\s/g, '')}`}>{asset.status}</span>

        <div className="asset-details">
          <p><strong>Category:</strong> {asset.category}</p>
          <p><strong>Location:</strong> {asset.location}</p>
          <p><strong>Condition:</strong> {asset.condition}</p>
          {asset.lastServiceDate && <p><strong>Last Service:</strong> {new Date(asset.lastServiceDate).toLocaleDateString()}</p>}
          {asset.nextServiceDate && <p><strong>Next Service:</strong> {new Date(asset.nextServiceDate).toLocaleDateString()}</p>}
        </div>

        {asset.status === 'Retired' ? (
          <p className="retired-note">This asset has been retired and is no longer in active use.</p>
        ) : (
          <Link to={`/report/${asset.assetCode}`} className="report-btn">Report an Issue</Link>
        )}
      </div>
    </div>
  );
};

export default PublicAssetPage;
