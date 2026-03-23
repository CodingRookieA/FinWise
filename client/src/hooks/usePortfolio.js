import { useState, useEffect, useCallback } from 'react';
import { SERVERURL } from '../utils/constants';
import toastHelper from '../utils/toastHelper';

const API_URL = `${SERVERURL}/api/assets`;

export const usePortfolio = () => {
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 1. Fetch Assets
    const fetchAssets = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `${API_URL}`,
                {
                    credentials: 'include'
                }
            );
            if (!response.ok) throw new Error('Failed to fetch assets');
            const data = await response.json();
            setAssets(data);
            setError(null);
        } catch (err) {
            console.error(err);
            setError(err.message);
            toastHelper('error', err.message)
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial Load
    useEffect(() => {
        fetchAssets();
    }, [fetchAssets]);

    // 2. Add Asset
    const addAsset = async (assetData) => {
        try {
            const payload = { ...assetData };
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload),
            });
            if (!response.ok){
                const res = await response.json()
                console.log(res)
                throw new Error(res.message);
            }
            
            // Refresh list after success
            await fetchAssets();
            return true; // Indicate success to the UI
        } catch (err) {
            setError(err.message);
            toastHelper('error', err.message)
            return false;
        }
    };

    // 3. Edit Asset
    const updateAsset = async (id, assetData) => {
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(assetData),
            });
            if (!response.ok) throw new Error('Failed to update asset');
            
            await fetchAssets();
            return true;
        } catch (err) {
            setError(err.message);
            toastHelper('error', err.message)
            return false;
        }
    };

    // 4. Delete Asset
    const deleteAsset = async (id) => {
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                credentials: 'include',
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Failed to delete asset');
            
            setAssets((prev) => prev.filter((asset) => asset._id !== id));
            return true;
        } catch (err) {
            setError(err.message);
            toastHelper('error', err.message)
            return false;
        }
    };

    // 5. Upload CSV
    const uploadCSV = async (file) => {
        try {
            const formData = new FormData();
            formData.append('csvFile', file);

            const response = await fetch(`${API_URL}/upload`, {
                method: 'POST',
                credentials: 'include',
                body: formData,
            });
            if (!response.ok) {
                const res = await response.json();
                throw new Error(res.message || 'Failed to upload CSV');
            }

            const result = await response.json();
            toastHelper('success', `Uploaded successfully! Added: ${result.added}, Skipped: ${result.skipped}`);
            await fetchAssets();
            return true;
        } catch (err) {
            setError(err.message);
            toastHelper('error', err.message);
            return false;
        }
    };

    return {
        assets,
        loading,
        error,
        addAsset,
        updateAsset,
        deleteAsset,
        uploadCSV,
        refresh: fetchAssets
    };
};