import React, { useEffect, useState } from 'react';
import api from '../api/api';
import '../styles/purchaseHistoryPage.css';
import { formatPaymentMethod, formatPurchaseStatus } from '../utils/displayLabels';

function PurchaseHistoryPage() {
    const [items, setItems] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const loadPurchases = async (targetPage = 1) => {
        try {
            setIsLoading(true);
            setError('');

            const response = await api.get('/purchases', {
                params: { page: targetPage, limit: 10 }
            });

            setItems(response.data.items || []);
            setPage(response.data.pagination?.page || 1);
            setTotalPages(response.data.pagination?.totalPages || 1);
        } catch (err) {
            console.error('שגיאה בטעינת היסטוריית רכישות:', err);
            setError('לא ניתן היה לטעון את היסטוריית הרכישות כרגע.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadPurchases(1);
    }, []);

    return (
        <div className="purchase-history-page">
            <h1 className="purchase-history-title">היסטוריית רכישות</h1>

            {isLoading ? (
                <p className="purchase-history-empty">טוען רכישות...</p>
            ) : error ? (
                <p className="purchase-history-error">{error}</p>
            ) : items.length === 0 ? (
                <p className="purchase-history-empty">לא נמצאו רכישות.</p>
            ) : (
                <div className="purchase-history-list">
                    {items.map((item) => (
                        <article key={item.id} className="purchase-history-card">
                            <h3>{item.courseName}</h3>
                            <p><strong>מחיר:</strong> ₪{Number(item.price || 0).toLocaleString('he-IL')}</p>
                            <p><strong>אמצעי תשלום:</strong> {formatPaymentMethod(item.paymentMethod)}</p>
                            <p><strong>מזהה עסקה:</strong> {item.transactionId || '-'}</p>
                            <p><strong>סטטוס:</strong> {formatPurchaseStatus(item.status)}</p>
                            <p><strong>תאריך:</strong> {item.date ? new Date(item.date).toLocaleString('he-IL') : '-'}</p>
                        </article>
                    ))}
                </div>
            )}

            <div className="purchase-history-pagination">
                <button
                    type="button"
                    className="purchase-history-button"
                    onClick={() => loadPurchases(page - 1)}
                    disabled={page <= 1 || isLoading}
                >
                    הקודם
                </button>
                <span>{page} / {totalPages}</span>
                <button
                    type="button"
                    className="purchase-history-button"
                    onClick={() => loadPurchases(page + 1)}
                    disabled={page >= totalPages || isLoading}
                >
                    הבא
                </button>
            </div>
        </div>
    );
}

export default PurchaseHistoryPage;
