"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Plus, Package, Edit2, Trash2,
    ArrowLeft, Loader2, X, Image as ImageIcon,
    Phone, MapPin, User
} from 'lucide-react';
import { DiscountService } from '@/services/DiscountService';
import { useAuth } from '@/context/AuthContext';
import { useStoreHelpers } from '@/hooks/useStoreHelpers';

export default function DiscountManagerPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, isAdmin, loading: authLoading } = useAuth();
    const { getLocalizedString } = useStoreHelpers();

    const [activeTab, setActiveTab] = useState('products'); // 'products' or 'orders'
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        brandName: '',
        subtitle: '',
        description: '',
        originalPrice: '',
        discountPrice: '',
        shippingFee: '0',
        images: [],
        optionGroups: [{ title: '', options: [{ name: '', addPrice: '0' }] }]
    });
    const [imageInput, setImageInput] = useState('');
    const [isUploadingImage, setIsUploadingImage] = useState(false);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.push('/login');
            return;
        }

        const init = async () => {
            const fetchedProducts = await fetchData();
            const editProductId = searchParams.get('editProductId');
            if (editProductId && fetchedProducts) {
                const targetProduct = fetchedProducts.find(p => p.id === editProductId);
                if (targetProduct) {
                    handleOpenModal(targetProduct);
                }
            }
        };

        init();
    }, [user, authLoading, activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            let data = [];
            if (activeTab === 'products') {
                const managerId = isAdmin ? null : user.uid;
                data = await DiscountService.getDiscountProducts(false, managerId);
                setProducts(data);
            } else {
                if (isAdmin) {
                    data = await DiscountService.getAllOrders();
                } else {
                    data = await DiscountService.getOrdersByManager(user.uid);
                }
                setOrders(data);
            }
            return data;
        } catch (error) {
            console.error("Error fetching data:", error);
            return null;
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (product = null) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                name: product.name,
                brandName: product.brandName || '',
                subtitle: product.subtitle || '',
                description: product.description || '',
                originalPrice: product.originalPrice,
                discountPrice: product.discountPrice,
                shippingFee: product.shippingFee || '0',
                images: product.images || [],
                optionGroups: product.optionGroups || [{ title: '', options: [{ name: '', addPrice: '0' }] }]
            });
            setTimeout(() => {
                setImageInput((product.images || []).join(','));
            }, 0);
        } else {
            setEditingProduct(null);
            setFormData({
                name: '',
                brandName: '',
                subtitle: '',
                description: '',
                originalPrice: '',
                discountPrice: '',
                shippingFee: '0',
                images: [],
                optionGroups: [{ title: '', options: [{ name: '', addPrice: '0' }] }]
            });
            setImageInput('');
        }
        setIsModalOpen(true);
    };

    const handleImagePaste = async (e) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const file = items[i].getAsFile();
                if (!file) continue;

                setIsUploadingImage(true);
                try {
                    const { StorageService } = await import('@/services/StorageService');
                    const url = await StorageService.uploadImage(file, 'discount_products');

                    const newImages = [...formData.images, url];
                    setFormData({ ...formData, images: newImages });
                    setImageInput(newImages.join(', '));

                    alert("이미지가 성공적으로 업로드되었습니다.");
                } catch (error) {
                    console.error("Paste upload failed:", error);
                    alert("이미지 업로드에 실패했습니다.");
                } finally {
                    setIsUploadingImage(false);
                }
            }
        }
    };

    const handleInsertImageLink = () => {
        const url = prompt("이미지 URL을 입력하세요 (https://...):");
        if (url && url.trim()) {
            const textarea = document.getElementById('body-description-textarea');
            const imageMarkdown = `\n![이미지](${url.trim()})\n`;
            const newText = formData.description + imageMarkdown;

            setFormData({ ...formData, description: newText });

            if (textarea) {
                setTimeout(() => {
                    textarea.focus();
                    const length = newText.length;
                    textarea.setSelectionRange(length, length);
                    textarea.scrollTop = textarea.scrollHeight;
                }, 0);
            }
        }
    };

    const handleBodyImagePaste = async (e) => {
        const items = e.clipboardData.items;
        const textarea = e.target;
        const startPos = textarea.selectionStart;
        const endPos = textarea.selectionEnd;

        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const file = items[i].getAsFile();
                if (!file) continue;

                e.preventDefault();
                setIsUploadingImage(true);
                try {
                    const { StorageService } = await import('@/services/StorageService');
                    const url = await StorageService.uploadImage(file, 'discount_products');

                    const imageMarkdown = `\n![이미지](${url})\n`;
                    const currentText = formData.description;
                    const newText = currentText.substring(0, startPos) + imageMarkdown + currentText.substring(endPos);

                    setFormData({ ...formData, description: newText });

                    setTimeout(() => {
                        textarea.focus();
                        const newCursorPos = startPos + imageMarkdown.length;
                        textarea.setSelectionRange(newCursorPos, newCursorPos);
                    }, 0);

                } catch (error) {
                    console.error("Body paste upload failed:", error);
                    alert("본문 이미지 업로드에 실패했습니다.");
                } finally {
                    setIsUploadingImage(false);
                }
            }
        }
    };

    const handleSaveProduct = async () => {
        try {
            const productData = {
                ...formData,
                originalPrice: Number(formData.originalPrice),
                discountPrice: Number(formData.discountPrice),
                shippingFee: Number(formData.shippingFee) || 0,
                optionGroups: formData.optionGroups
                    .filter(group => group.title.trim() !== '')
                    .map(group => ({
                        ...group,
                        options: group.options
                            .filter(opt => opt.name.trim() !== '')
                            .map(opt => ({
                                ...opt,
                                addPrice: Number(opt.addPrice) || 0
                            }))
                    })),
                managerId: isAdmin && editingProduct ? editingProduct.managerId : user.uid
            };

            if (editingProduct) {
                await DiscountService.updateProduct(editingProduct.id, productData, formData.images);
            } else {
                await DiscountService.createProduct(productData, formData.images, user.uid);
            }

            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            alert("저장 중 오류가 발생했습니다.");
        }
    };

    const handleDiscountInput = (value, originalValue, setter) => {
        const match = value.match(/(-?\d+(?:\.\d+)?)\s*%/);
        if (match && originalValue) {
            const percent = Math.abs(parseFloat(match[1]));
            const calculated = Math.round(Number(originalValue) * (1 - percent / 100));
            setter(calculated.toString());
            return;
        }
        setter(value);
    };

    const handleDeleteProduct = async (productId) => {
        if (window.confirm("정말 이 상품을 삭제하시겠습니까?")) {
            try {
                await DiscountService.deleteProduct(productId);
                fetchData();
            } catch (error) {
                alert("삭제 중 오류가 발생했습니다.");
            }
        }
    };

    const handleUpdateOrderStatus = async (orderId, status) => {
        try {
            await DiscountService.updateOrderStatus(orderId, status);
            fetchData();
        } catch (error) {
            alert("상태 변경 중 오류가 발생했습니다.");
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return '#F59E0B';
            case 'shipping': return '#3B82F6';
            case 'completed': return '#10B981';
            case 'cancelled': return '#EF4444';
            default: return '#64748B';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'pending': return '주문접수';
            case 'shipping': return '배송중';
            case 'completed': return '배송완료';
            case 'cancelled': return '취소됨';
            default: return status;
        }
    };

    if (authLoading || (loading && !products.length && !orders.length)) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8fafc' }}>
                <Loader2 className="animate-spin" size={40} color="#6366f1" />
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '24px 16px', paddingBottom: '80px' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button onClick={() => router.push('/admin')} style={{ padding: '8px', borderRadius: '12px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
                            <ArrowLeft size={20} />
                        </button>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>할인몰 관리</h1>
                    </div>
                    {activeTab === 'products' && (
                        <button
                            onClick={() => handleOpenModal()}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '10px 16px', borderRadius: '14px',
                                background: '#6366f1', color: 'white',
                                fontWeight: 700, border: 'none', cursor: 'pointer'
                            }}
                        >
                            <Plus size={18} /> 상품 등록
                        </button>
                    )}
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: '#ffffff', padding: '4px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                    <button
                        onClick={() => setActiveTab('products')}
                        style={{
                            flex: 1, padding: '12px', borderRadius: '12px',
                            fontSize: '0.9rem', fontWeight: 800,
                            background: activeTab === 'products' ? '#6366f1' : 'transparent',
                            color: activeTab === 'products' ? 'white' : '#64748b',
                            border: 'none', transition: 'all 0.2s', cursor: 'pointer'
                        }}
                    >
                        상품 관리 ({products.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('orders')}
                        style={{
                            flex: 1, padding: '12px', borderRadius: '12px',
                            fontSize: '0.9rem', fontWeight: 800,
                            background: activeTab === 'orders' ? '#6366f1' : 'transparent',
                            color: activeTab === 'orders' ? 'white' : '#64748b',
                            border: 'none', transition: 'all 0.2s', cursor: 'pointer'
                        }}
                    >
                        주문 내역 ({orders.length})
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {activeTab === 'products' ? (
                        products.length > 0 ? (
                            products.map(product => (
                                <div key={product.id} style={{
                                    display: 'flex', alignItems: 'center', gap: '16px',
                                    padding: '16px', background: '#ffffff',
                                    borderRadius: '20px', border: '1px solid #e2e8f0'
                                }}>
                                    <div style={{ width: '60px', height: '60px', borderRadius: '12px', background: `url(${product.images?.[0] || ''}) center/cover`, backgroundColor: '#f1f5f9' }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: '2px' }}>{product.name}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{Number(product.discountPrice || 0).toLocaleString()} VND</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={() => handleOpenModal(product)}
                                            style={{ padding: '8px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#3B82F6', cursor: 'pointer' }}
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteProduct(product.id)}
                                            style={{ padding: '8px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#EF4444', cursor: 'pointer' }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>등록된 상품이 없습니다.</div>
                        )
                    ) : (
                        orders.length > 0 ? (
                            orders.map(order => (
                                <div key={order.id} style={{
                                    padding: '20px', background: '#ffffff',
                                    borderRadius: '24px', border: '1px solid #e2e8f0',
                                    display: 'flex', flexDirection: 'column', gap: '16px'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>
                                                {order.createdAt ? (order.createdAt.seconds ? new Date(order.createdAt.seconds * 1000).toLocaleString() : new Date(order.createdAt).toLocaleString()) : '-'}
                                            </div>
                                            <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{order.productName}</div>
                                        </div>
                                        <div style={{
                                            padding: '4px 12px', borderRadius: '10px',
                                            fontSize: '0.75rem', fontWeight: 800,
                                            background: `${getStatusColor(order.status)}15`,
                                            color: getStatusColor(order.status)
                                        }}>
                                            {getStatusLabel(order.status)}
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', padding: '16px', background: '#f8fafc', borderRadius: '16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <User size={14} color="#6366f1" />
                                            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{order.userName}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Phone size={14} color="#6366f1" />
                                            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{order.userPhone}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', gridColumn: 'span 2' }}>
                                            <MapPin size={14} color="#6366f1" />
                                            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{order.address}</span>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        {order.status === 'pending' && (
                                            <button
                                                onClick={() => handleUpdateOrderStatus(order.id, 'shipping')}
                                                style={{ flex: 1, padding: '10px', borderRadius: '12px', background: '#3B82F6', color: 'white', fontWeight: 700, border: 'none', cursor: 'pointer' }}
                                            >
                                                배송 시작
                                            </button>
                                        )}
                                        {order.status === 'shipping' && (
                                            <button
                                                onClick={() => handleUpdateOrderStatus(order.id, 'completed')}
                                                style={{ flex: 1, padding: '10px', borderRadius: '12px', background: '#10B981', color: 'white', fontWeight: 700, border: 'none', cursor: 'pointer' }}
                                            >
                                                배송 완료
                                            </button>
                                        )}
                                        {order.status !== 'completed' && order.status !== 'cancelled' && (
                                            <button
                                                onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}
                                                style={{ padding: '10px 16px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#EF4444', fontWeight: 700, cursor: 'pointer' }}
                                            >
                                                취소
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>주문 내역이 없습니다.</div>
                        )
                    )}
                </div>
            </div>

            {/* Product Edit Modal */}
            {isModalOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                    <div
                        onClick={() => setIsModalOpen(false)}
                        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
                    />
                    <div
                        style={{
                            position: 'relative', width: '100%', maxWidth: '500px',
                            background: '#ffffff', borderRadius: '28px',
                            padding: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                            maxHeight: '90vh', overflowY: 'auto'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{editingProduct ? '상품 수정' : '신규 상품 등록'}</h2>
                            <button onClick={() => setIsModalOpen(false)} style={{ padding: '8px', borderRadius: '50%', background: '#f8fafc', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: '#64748b' }}>상품명</label>
                                    <input
                                        type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="예: 프리미엄 세트"
                                        style={{ width: '100%', padding: '12px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', outline: 'none', color: '#1e293b' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: '#64748b' }}>회사/브랜드명</label>
                                    <input
                                        type="text" value={formData.brandName} onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                                        placeholder="예: 쿠퐁온라인식품"
                                        style={{ width: '100%', padding: '12px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', outline: 'none', color: '#1e293b' }}
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: '#64748b' }}>서브타이틀 (짧은 설명)</label>
                                <input
                                    type="text" value={formData.subtitle} onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                                    style={{ width: '100%', padding: '12px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', outline: 'none', color: '#1e293b' }}
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: '#64748b' }}>정상가 (VND)</label>
                                    <input
                                        type="text" inputMode="numeric" value={formData.originalPrice} onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value.replace(/[^0-9]/g, '') })}
                                        placeholder="예: 50000"
                                        style={{ width: '100%', padding: '12px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', outline: 'none', color: '#1e293b' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: '#64748b' }}>할인가 (VND/%)</label>
                                    <input
                                        type="text" value={formData.discountPrice}
                                        onChange={(e) => handleDiscountInput(e.target.value, formData.originalPrice, (val) => setFormData({ ...formData, discountPrice: val }))}
                                        placeholder="예: 40000"
                                        style={{ width: '100%', padding: '12px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', outline: 'none', color: '#1e293b' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: '#64748b' }}>배송비 (VND)</label>
                                    <input
                                        type="text" value={formData.shippingFee} onChange={(e) => setFormData({ ...formData, shippingFee: e.target.value.replace(/[^0-9]/g, '') })}
                                        placeholder="예: 0"
                                        style={{ width: '100%', padding: '12px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', outline: 'none', color: '#1e293b' }}
                                    />
                                </div>
                            </div>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b' }}>상품 상세 설명</label>
                                    <button
                                        onClick={handleInsertImageLink}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px',
                                            borderRadius: '8px', background: 'rgba(99, 102, 241, 0.1)',
                                            color: '#6366f1', border: 'none', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer'
                                        }}
                                    >
                                        <ImageIcon size={14} /> 이미지 링크 추가
                                    </button>
                                </div>
                                <textarea
                                    id="body-description-textarea"
                                    rows={8} value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    onPaste={handleBodyImagePaste}
                                    disabled={isUploadingImage}
                                    placeholder="상세 내용을 입력하세요. 이미지를 직접 붙여넣거나 링크로 삽입할 수 있습니다."
                                    style={{
                                        width: '100%', padding: '12px', borderRadius: '12px',
                                        background: '#f8fafc', border: '1px solid #e2e8f0',
                                        outline: 'none', resize: 'vertical', color: '#1e293b',
                                        minHeight: '150px',
                                        opacity: isUploadingImage ? 0.6 : 1
                                    }}
                                />
                                {isUploadingImage && (
                                    <p style={{ fontSize: '0.75rem', color: '#6366f1', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Loader2 className="animate-spin" size={14} /> 본문 이미지 업로드 중...
                                    </p>
                                )}
                            </div>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b' }}>
                                        이미지 URL (쉼표로 구분) 또는 이미지를 여기에 붙여넣으세요
                                    </label>
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="text"
                                        value={imageInput}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setImageInput(val);
                                            setFormData({
                                                ...formData,
                                                images: val.split(',').map(s => s.trim()).filter(Boolean)
                                            });
                                        }}
                                        onPaste={handleImagePaste}
                                        disabled={isUploadingImage}
                                        placeholder="https://... (Ctrl+V로 이미지 붙여넣기 가능)"
                                        style={{
                                            width: '100%', padding: '12px', paddingRight: isUploadingImage ? '40px' : '12px',
                                            borderRadius: '12px', background: '#f8fafc',
                                            border: '1px solid #e2e8f0', outline: 'none',
                                            color: '#1e293b',
                                            opacity: isUploadingImage ? 0.6 : 1
                                        }}
                                    />
                                    {isUploadingImage && (
                                        <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                                            <Loader2 className="animate-spin" size={18} color="#6366f1" />
                                        </div>
                                    )}
                                </div>
                                <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px' }}>
                                    * 이미지를 캡처하거나 복사한 뒤 이곳에 붙여넣으면 즉시 업로드됩니다.
                                </p>
                            </div>

                            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginTop: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b' }}>옵션 그룹 설정 (사이즈/컬러 등)</label>
                                    <button
                                        onClick={() => {
                                            const newGroups = [...formData.optionGroups, { title: '', options: [{ name: '', addPrice: '0' }] }];
                                            setFormData({ ...formData, optionGroups: newGroups });
                                        }}
                                        style={{ padding: '6px 12px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', border: 'none', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer' }}
                                    >
                                        + 그룹 추가
                                    </button>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    {formData.optionGroups.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '30px', background: '#f8fafc', borderRadius: '20px', border: '1.5px dashed #e2e8f0', color: '#94a3b8', fontSize: '0.85rem' }}>
                                            등록된 옵션 그룹이 없습니다. '그룹 추가' 버튼을 눌러보세요.
                                        </div>
                                    ) : (
                                        formData.optionGroups.map((group, gIdx) => (
                                            <div key={gIdx} style={{ padding: '16px', background: '#f8fafc', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                                                <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                                                    <input
                                                        placeholder="옵션 그룹명 (예: 컬러 선택)"
                                                        value={group.title}
                                                        onChange={(e) => {
                                                            const newGroups = [...formData.optionGroups];
                                                            newGroups[gIdx].title = e.target.value;
                                                            setFormData({ ...formData, optionGroups: newGroups });
                                                        }}
                                                        style={{ flex: 1, padding: '10px 14px', borderRadius: '12px', background: '#ffffff', border: '1px solid #e2e8f0', color: '#1e293b', fontSize: '0.9rem', fontWeight: 700 }}
                                                    />
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            const newGroups = formData.optionGroups.filter((_, i) => i !== gIdx);
                                                            setFormData({ ...formData, optionGroups: newGroups });
                                                        }}
                                                        style={{ padding: '10px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#EF4444', cursor: 'pointer' }}
                                                        title="그룹 전체 삭제"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>

                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    {group.options.map((opt, oIdx) => (
                                                        <div key={oIdx} style={{ display: 'flex', gap: '6px' }}>
                                                            <input
                                                                placeholder="항목명"
                                                                value={opt.name}
                                                                onChange={(e) => {
                                                                    const newGroups = [...formData.optionGroups];
                                                                    newGroups[gIdx].options[oIdx].name = e.target.value;
                                                                    setFormData({ ...formData, optionGroups: newGroups });
                                                                }}
                                                                style={{ flex: 1.5, padding: '8px 12px', borderRadius: '10px', background: '#ffffff', border: '1px solid #e2e8f0', color: '#1e293b', fontSize: '0.85rem' }}
                                                            />
                                                            <input
                                                                placeholder="추가금액"
                                                                value={opt.addPrice}
                                                                onChange={(e) => {
                                                                    const newGroups = [...formData.optionGroups];
                                                                    newGroups[gIdx].options[oIdx].addPrice = e.target.value.replace(/[^0-9]/g, '');
                                                                    setFormData({ ...formData, optionGroups: newGroups });
                                                                }}
                                                                style={{ flex: 1, padding: '8px 12px', borderRadius: '10px', background: '#ffffff', border: '1px solid #e2e8f0', color: '#1e293b', fontSize: '0.85rem' }}
                                                            />
                                                            <button
                                                                onClick={() => {
                                                                    const newGroups = [...formData.optionGroups];
                                                                    newGroups[gIdx].options = newGroups[gIdx].options.filter((_, i) => i !== oIdx);
                                                                    setFormData({ ...formData, optionGroups: newGroups });
                                                                }}
                                                                style={{ padding: '8px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                                                            >
                                                                <X size={16} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    <button
                                                        onClick={() => {
                                                            const newGroups = [...formData.optionGroups];
                                                            newGroups[gIdx].options.push({ name: '', addPrice: '0' });
                                                            setFormData({ ...formData, optionGroups: newGroups });
                                                        }}
                                                        style={{ padding: '6px', borderRadius: '8px', background: '#ffffff', border: '1px dashed #e2e8f0', color: '#64748b', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', marginTop: '4px' }}
                                                    >
                                                        + 항목 추가
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={handleSaveProduct}
                                style={{
                                    width: '100%', padding: '16px', background: '#6366f1',
                                    color: 'white', border: 'none', borderRadius: '16px',
                                    fontSize: '1rem', fontWeight: 900, cursor: 'pointer',
                                    boxShadow: '0 10px 20px rgba(99,102,241,0.2)', marginTop: '12px'
                                }}
                            >
                                저장 완료
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
