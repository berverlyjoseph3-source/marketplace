
        // Global variables
        let currentUser = null;
        let charts = {};
        let map = null;
        let activeFilters = {};
        let productData = [];
        let websocket = null;
        let currentTheme = 'light';

        // Initialize dashboard
        document.addEventListener('DOMContentLoaded', function() {
            showLoading();
            
            // Check admin authentication
            checkAdminAuth();
            
            // Initialize dashboard components
            initializeDashboard();
            
            // Load initial data
            loadInitialData();
            
            // Initialize WebSocket for real-time updates
            initializeWebSocket();
            
            // Set up event listeners
            setupEventListeners();
            
            setTimeout(hideLoading, 1000);
        });

        function checkAdminAuth() {
            const user = JSON.parse(localStorage.getItem('user'));
            const token = localStorage.getItem('token');
            
            if (!user || !token) {
                showAlert('Admin authentication required', 'error');
                window.location.href = 'admin-login.html';
                return false;
            }
            
            if (user.role !== 'admin') {
                showAlert('Admin privileges required', 'error');
                window.location.href = 'index.html';
                return false;
            }
            
            currentUser = user;
            document.getElementById('adminName').textContent = user.name || user.email;
            return true;
        }

        function initializeDashboard() {
            // Initialize charts
            initializeTrendChart();
            initializeHeatmap();
            initializeSegmentationChart();
            initializeForecastChart();
            initializeBudgetChart();
            
            // Initialize map
            initializeRegionMap();
            
            // Initialize date pickers
            initializeDatePickers();
            
            // Initialize sparklines
            initializeSparklines();
            
            // Set default theme
            setTheme(currentTheme);
        }

        function initializeTrendChart() {
            const ctx = document.getElementById('trendChart').getContext('2d');
            
            // Sample data
            const labels = Array.from({length: 30}, (_, i) => 
                new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString()
            );
            
            charts.trend = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Revenue',
                            data: Array.from({length: 30}, () => Math.floor(Math.random() * 10000) + 20000),
                            borderColor: '#3b82f6',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            borderWidth: 2,
                            tension: 0.4,
                            fill: true
                        },
                        {
                            label: 'Operational Costs',
                            data: Array.from({length: 30}, () => Math.floor(Math.random() * 5000) + 5000),
                            borderColor: '#ef4444',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            borderWidth: 2,
                            tension: 0.4,
                            fill: true
                        },
                        {
                            label: 'Net Profit',
                            data: Array.from({length: 30}, () => Math.floor(Math.random() * 8000) + 12000),
                            borderColor: '#10b981',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            borderWidth: 2,
                            tension: 0.4,
                            fill: true
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false
                    },
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false
                        },
                        zoom: {
                            zoom: {
                                wheel: {
                                    enabled: true,
                                },
                                pinch: {
                                    enabled: true
                                },
                                mode: 'xy',
                            },
                            pan: {
                                enabled: true,
                                mode: 'xy'
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                display: false
                            }
                        },
                        y: {
                            beginAtZero: false,
                            ticks: {
                                callback: function(value) {
                                    return '$' + value.toLocaleString();
                                }
                            }
                        }
                    }
                }
            });
        }

        function initializeRegionMap() {
            map = L.map('regionMap').setView([20, 0], 2);
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);
            
            // Add sample regions
            const regions = [
                { lat: 40, lng: -100, name: 'North America', value: 85000 },
                { lat: 48, lng: 15, name: 'Europe', value: 62000 },
                { lat: 35, lng: 105, name: 'Asia', value: 45000 },
                { lat: -25, lng: 135, name: 'Australia', value: 18000 },
                { lat: -15, lng: -60, name: 'South America', value: 22000 }
            ];
            
            regions.forEach(region => {
                const color = getColorForValue(region.value);
                const circle = L.circleMarker([region.lat, region.lng], {
                    color: color,
                    fillColor: color,
                    fillOpacity: 0.7,
                    radius: Math.sqrt(region.value / 1000) * 2
                }).addTo(map);
                
                circle.bindPopup(`
                    <strong>${region.name}</strong><br>
                    Revenue: $${region.value.toLocaleString()}<br>
                    Orders: ${Math.floor(region.value / 150)}<br>
                    Growth: +${Math.floor(Math.random() * 20) + 5}%
                `);
            });
        }

        function initializeHeatmap() {
            const ctx = document.getElementById('correlationHeatmap').getContext('2d');
            
            const data = {
                labels: ['Customer Spend', 'Engagement Rate', 'Cart Abandonment', 'Churn Rate', 'Marketing Spend'],
                datasets: [{
                    label: 'Correlation Matrix',
                    data: [
                        [0, 0.8, -0.6, -0.7, 0.9],
                        [0.8, 0, -0.5, -0.6, 0.7],
                        [-0.6, -0.5, 0, 0.8, -0.4],
                        [-0.7, -0.6, 0.8, 0, -0.5],
                        [0.9, 0.7, -0.4, -0.5, 0]
                    ],
                    backgroundColor: function(context) {
                        const value = context.dataset.data[context.dataIndex];
                        const alpha = Math.abs(value);
                        if (value > 0) {
                            return `rgba(16, 185, 129, ${alpha})`;
                        } else if (value < 0) {
                            return `rgba(239, 68, 68, ${alpha})`;
                        }
                        return 'rgba(156, 163, 175, 0.1)';
                    },
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    borderWidth: 1,
                    width: function(ctx) {
                        const a = ctx.chart.chartArea;
                        return (a.right - a.left) / 5 - 10;
                    },
                    height: function(ctx) {
                        const a = ctx.chart.chartArea;
                        return (a.bottom - a.top) / 5 - 10;
                    }
                }]
            };
            
            charts.heatmap = new Chart(ctx, {
                type: 'matrix',
                data: data,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const row = context.dataIndex;
                                    const col = context.datasetIndex;
                                    const value = context.dataset.data[row][col];
                                    return `Correlation: ${value.toFixed(2)}`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            ticks: {
                                display: true
                            },
                            grid: {
                                display: false
                            }
                        },
                        y: {
                            ticks: {
                                display: true
                            },
                            grid: {
                                display: false
                            }
                        }
                    }
                }
            });
        }

        function initializeSegmentationChart() {
            const ctx = document.getElementById('segmentationChart').getContext('2d');
            
            charts.segmentation = new Chart(ctx, {
                type: 'bubble',
                data: {
                    datasets: [
                        {
                            label: 'High Value',
                            data: Array.from({length: 15}, () => ({
                                x: Math.random() * 100,
                                y: Math.random() * 100,
                                r: Math.random() * 20 + 15
                            })),
                            backgroundColor: 'rgba(59, 130, 246, 0.7)',
                            borderColor: '#3b82f6'
                        },
                        {
                            label: 'New Customers',
                            data: Array.from({length: 25}, () => ({
                                x: Math.random() * 100,
                                y: Math.random() * 100,
                                r: Math.random() * 10 + 5
                            })),
                            backgroundColor: 'rgba(16, 185, 129, 0.7)',
                            borderColor: '#10b981'
                        },
                        {
                            label: 'At Risk',
                            data: Array.from({length: 10}, () => ({
                                x: Math.random() * 100,
                                y: Math.random() * 100,
                                r: Math.random() * 12 + 8
                            })),
                            backgroundColor: 'rgba(245, 158, 11, 0.7)',
                            borderColor: '#f59e0b'
                        },
                        {
                            label: 'Dormant',
                            data: Array.from({length: 30}, () => ({
                                x: Math.random() * 100,
                                y: Math.random() * 100,
                                r: Math.random() * 8 + 3
                            })),
                            backgroundColor: 'rgba(156, 163, 175, 0.7)',
                            borderColor: '#9ca3af'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'Purchase Frequency'
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Average Order Value'
                            }
                        }
                    }
                }
            });
        }

        function initializeForecastChart() {
            const ctx = document.getElementById('forecastChart').getContext('2d');
            
            const historicalData = Array.from({length: 60}, (_, i) => ({
                x: new Date(Date.now() - (59 - i) * 24 * 60 * 60 * 1000),
                y: Math.floor(Math.random() * 5000) + 15000
            }));
            
            const forecastData = Array.from({length: 30}, (_, i) => ({
                x: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000),
                y: Math.floor(Math.random() * 6000) + 18000
            }));
            
            charts.forecast = new Chart(ctx, {
                type: 'line',
                data: {
                    datasets: [
                        {
                            label: 'Historical',
                            data: historicalData,
                            borderColor: '#3b82f6',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            borderWidth: 2,
                            tension: 0.4,
                            fill: true
                        },
                        {
                            label: 'Forecast',
                            data: forecastData,
                            borderColor: '#10b981',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            borderWidth: 2,
                            tension: 0.4,
                            fill: true,
                            borderDash: [5, 5]
                        },
                        {
                            label: 'Upper Bound',
                            data: forecastData.map(d => ({ x: d.x, y: d.y * 1.1 })),
                            borderColor: 'rgba(16, 185, 129, 0.3)',
                            backgroundColor: 'rgba(16, 185, 129, 0.05)',
                            borderWidth: 1,
                            fill: '-1',
                            pointRadius: 0
                        },
                        {
                            label: 'Lower Bound',
                            data: forecastData.map(d => ({ x: d.x, y: d.y * 0.9 })),
                            borderColor: 'rgba(16, 185, 129, 0.3)',
                            backgroundColor: 'rgba(16, 185, 129, 0.05)',
                            borderWidth: 1,
                            fill: '-1',
                            pointRadius: 0
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            type: 'time',
                            time: {
                                unit: 'day'
                            }
                        },
                        y: {
                            beginAtZero: false,
                            ticks: {
                                callback: function(value) {
                                    return '$' + value.toLocaleString();
                                }
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'top'
                        }
                    }
                }
            });
        }

        function initializeBudgetChart() {
            const ctx = document.getElementById('budgetChart').getContext('2d');
            
            charts.budget = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Phones', 'Laptops', 'Tablets', 'Accessories', 'Gaming'],
                    datasets: [
                        {
                            label: 'Actual Revenue',
                            data: [85000, 62000, 45000, 32000, 28000],
                            backgroundColor: '#3b82f6',
                            borderColor: '#2563eb',
                            borderWidth: 1
                        },
                        {
                            label: 'Budgeted Revenue',
                            data: [80000, 65000, 40000, 35000, 25000],
                            backgroundColor: '#10b981',
                            borderColor: '#059669',
                            borderWidth: 1
                        },
                        {
                            label: 'Variance',
                            data: [5000, -3000, 5000, -3000, 3000],
                            backgroundColor: function(context) {
                                const value = context.raw;
                                return value >= 0 ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)';
                            },
                            borderColor: function(context) {
                                const value = context.raw;
                                return value >= 0 ? '#10b981' : '#ef4444';
                            },
                            borderWidth: 1,
                            type: 'line',
                            fill: false,
                            tension: 0.4
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return '$' + value.toLocaleString();
                                }
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'top'
                        }
                    }
                }
            });
        }

        function initializeSparklines() {
            // Initialize sparkline charts for KPI cards
            const sparklineOptions = {
                type: 'line',
                data: {
                    labels: Array.from({length: 10}, (_, i) => i),
                    datasets: [{
                        data: Array.from({length: 10}, () => Math.random() * 100),
                        borderColor: '#ffffff',
                        borderWidth: 1,
                        fill: false,
                        tension: 0.4,
                        pointRadius: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { display: false },
                        y: { display: false }
                    },
                    plugins: {
                        legend: { display: false }
                    }
                }
            };

            // Create sparklines for each KPI card
            ['revenueSparkline', 'ordersSparkline', 'aovSparkline', 'customersSparkline', 'abandonmentSparkline']
                .forEach(id => {
                    const ctx = document.getElementById(id).getContext('2d');
                    new Chart(ctx, sparklineOptions);
                });
        }

        function showSection(sectionId) {
            // Hide all sections
            document.querySelectorAll('.analytics-section').forEach(section => {
                section.style.display = 'none';
            });
            
            // Show selected section
            const targetSection = document.getElementById(`${sectionId}Section`);
            if (targetSection) {
                targetSection.style.display = 'block';
            }
            
            // Update navigation
            document.querySelectorAll('.admin-nav a').forEach(link => {
                link.classList.remove('active');
            });
            
            const navLink = document.querySelector(`.admin-nav a[onclick*="${sectionId}"]`);
            if (navLink) {
                navLink.classList.add('active');
            }
            
            // Load section-specific data
            switch(sectionId) {
                case 'products':
                    loadProducts();
                    break;
                case 'orders':
                    loadOrderAnalytics();
                    break;
                case 'customers':
                    loadCustomerInsights();
                    break;
                case 'financial':
                    loadFinancialAnalytics();
                    break;
            }
        }

        function loadProducts() {
            // Load products from API or use mock data
            fetch('/api/products')
                .then(response => response.json())
                .then(data => {
                    productData = data;
                    renderProductGrid(data);
                })
                .catch(error => {
                    console.error('Error loading products:', error);
                    // Use mock data for demo
                    loadMockProducts();
                });
        }

        function renderProductGrid(products) {
            const container = document.getElementById('productGrid');
            if (!container) return;
            
            container.innerHTML = products.map(product => `
                <div class="product-card" data-id="${product.id}">
                    <div class="product-card-header">
                        <div class="product-image">
                            <img src="${product.image || 'images/placeholder.jpg'}" 
                                 alt="${product.name}"
                                 onerror="this.src='images/placeholder.jpg'">
                            <span class="product-badge ${product.status}">${product.status}</span>
                        </div>
                        <div class="product-actions">
                            <button class="btn-icon" onclick="viewProduct('${product.id}')" title="View">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn-icon" onclick="editProduct('${product.id}')" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-icon delete" onclick="deleteProduct('${product.id}')" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="product-card-body">
                        <h4 class="product-name">${product.name}</h4>
                        <div class="product-meta">
                            <span class="product-category">${product.category}</span>
                            <span class="product-brand">${product.brand}</span>
                        </div>
                        <div class="product-price">
                            $${product.price.toFixed(2)}
                            ${product.discount ? `<span class="product-discount">$${product.discount.toFixed(2)}</span>` : ''}
                        </div>
                        <div class="product-stock">
                            <div class="stock-bar">
                                <div class="stock-fill" style="width: ${(product.stock / product.maxStock) * 100}%"></div>
                            </div>
                            <span class="stock-count">${product.stock} in stock</span>
                        </div>
                        <div class="product-stats">
                            <div class="stat">
                                <i class="fas fa-shopping-cart"></i>
                                <span>${product.sales || 0} sold</span>
                            </div>
                            <div class="stat">
                                <i class="fas fa-star"></i>
                                <span>${product.rating || '4.5'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        function showAddProductModal() {
            document.getElementById('addProductModal').style.display = 'flex';
        }

        function showBulkUploadModal() {
            document.getElementById('bulkUploadModal').style.display = 'flex';
        }

        function saveProduct() {
            const formData = new FormData();
            
            // Get form values
            const product = {
                name: document.getElementById('productName').value,
                sku: document.getElementById('productSku').value,
                category: document.getElementById('productCategory').value,
                brand: document.getElementById('productBrand').value,
                price: parseFloat(document.getElementById('productPrice').value),
                cost: document.getElementById('productCost').value ? 
                    parseFloat(document.getElementById('productCost').value) : null,
                stock: parseInt(document.getElementById('productStock').value),
                description: document.getElementById('productDescription').value,
                shortDescription: document.getElementById('productShortDescription').value,
                specifications: document.getElementById('productSpecifications').value,
                featured: document.getElementById('productFeatured').checked,
                onSale: document.getElementById('productOnSale').checked,
                status: document.querySelector('input[name="productStatus"]:checked').value
            };
            
            // Append product data
            Object.keys(product).forEach(key => {
                formData.append(key, product[key]);
            });
            
            // Append images
            const imageInput = document.getElementById('productImages');
            for (let i = 0; i < imageInput.files.length; i++) {
                formData.append('images', imageInput.files[i]);
            }
            
            // Show loading
            showLoading();
            
            // Send to server
            fetch('/api/products', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                hideLoading();
                if (data.success) {
                    showAlert('Product added successfully!', 'success');
                    closeModal('addProductModal');
                    loadProducts(); // Refresh product list
                } else {
                    showAlert(data.message || 'Failed to add product', 'error');
                }
            })
            .catch(error => {
                hideLoading();
                console.error('Error saving product:', error);
                showAlert('Failed to save product', 'error');
            });
        }

        function deleteProduct(productId) {
            // Find product name for confirmation
            const product = productData.find(p => p.id === productId);
            if (!product) return;
            
            // Show confirmation modal
            document.getElementById('deleteProductName').textContent = product.name;
            document.getElementById('deleteConfirmModal').style.display = 'flex';
            
            // Store product ID for deletion
            window.currentProductId = productId;
        }

        function confirmDeleteProduct() {
            const deleteImages = document.getElementById('deleteImages').checked;
            const deleteInventory = document.getElementById('deleteInventory').checked;
            
            showLoading();
            
            fetch(`/api/products/${window.currentProductId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    deleteImages,
                    deleteInventory
                })
            })
            .then(response => response.json())
            .then(data => {
                hideLoading();
                if (data.success) {
                    showAlert('Product deleted successfully', 'success');
                    closeModal('deleteConfirmModal');
                    loadProducts(); // Refresh product list
                } else {
                    showAlert(data.message || 'Failed to delete product', 'error');
                }
            })
            .catch(error => {
                hideLoading();
                console.error('Error deleting product:', error);
                showAlert('Failed to delete product', 'error');
            });
        }

        function handleCsvUpload(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = function(e) {
                const csvContent = e.target.result;
                const rows = csvContent.split('\n');
                
                // Parse CSV
                const headers = rows[0].split(',');
                const data = rows.slice(1).map(row => {
                    const values = row.split(',');
                    return headers.reduce((obj, header, index) => {
                        obj[header.trim()] = values[index] ? values[index].trim() : '';
                        return obj;
                    }, {});
                }).filter(row => row.SKU); // Remove empty rows
                
                // Show preview
                showCsvPreview(headers, data);
            };
            
            reader.readAsText(file);
        }

        function showCsvPreview(headers, data) {
            const previewTable = document.getElementById('csvPreviewTable');
            const previewStats = document.getElementById('csvPreviewStats');
            const previewSection = document.getElementById('csvPreview');
            const uploadBtn = document.getElementById('confirmUploadBtn');
            
            // Clear previous content
            previewTable.innerHTML = '';
            
            // Add header row
            const headerRow = document.createElement('tr');
            headers.forEach(header => {
                const th = document.createElement('th');
                th.textContent = header;
                headerRow.appendChild(th);
            });
            previewTable.appendChild(headerRow);
            
            // Add data rows (limit to 5 for preview)
            data.slice(0, 5).forEach(row => {
                const tr = document.createElement('tr');
                headers.forEach(header => {
                    const td = document.createElement('td');
                    td.textContent = row[header] || '';
                    tr.appendChild(td);
                });
                previewTable.appendChild(tr);
            });
            
            // Update stats
            previewStats.innerHTML = `
                <div class="stat">
                    <i class="fas fa-table"></i>
                    <span>${data.length} products to upload</span>
                </div>
                <div class="stat">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>${countDuplicates(data)} potential duplicates</span>
                </div>
            `;
            
            // Show preview and enable upload button
            previewSection.style.display = 'block';
            uploadBtn.disabled = false;
            
            // Store data for upload
            window.csvUploadData = data;
        }

        function confirmBulkUpload() {
            if (!window.csvUploadData || window.csvUploadData.length === 0) {
                showAlert('No data to upload', 'error');
                return;
            }
            
            showLoading();
            
            fetch('/api/products/bulk', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ products: window.csvUploadData })
            })
            .then(response => response.json())
            .then(data => {
                hideLoading();
                if (data.success) {
                    showAlert(`Successfully uploaded ${data.inserted} products`, 'success');
                    closeModal('bulkUploadModal');
                    loadProducts(); // Refresh product list
                } else {
                    showAlert(data.message || 'Failed to upload products', 'error');
                }
            })
            .catch(error => {
                hideLoading();
                console.error('Error uploading products:', error);
                showAlert('Failed to upload products', 'error');
            });
        }

        function toggleTheme() {
            currentTheme = currentTheme === 'light' ? 'dark' : 'light';
            setTheme(currentTheme);
        }

        function setTheme(theme) {
            document.body.setAttribute('data-theme', theme);
            document.body.classList.toggle('dark-theme', theme === 'dark');
            
            // Update theme icon
            const themeIcon = document.querySelector('.btn-icon[onclick="toggleTheme()"] i');
            themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            
            // Save theme preference
            localStorage.setItem('adminTheme', theme);
        }

        function initializeWebSocket() {
            // Connect to WebSocket server for real-time updates
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.host}/ws/admin`;
            
            websocket = new WebSocket(wsUrl);
            
            websocket.onopen = function() {
                console.log('WebSocket connected');
                updateConnectionStatus(true);
            };
            
            websocket.onmessage = function(event) {
                const data = JSON.parse(event.data);
                handleWebSocketMessage(data);
            };
            
            websocket.onclose = function() {
                console.log('WebSocket disconnected');
                updateConnectionStatus(false);
                // Attempt to reconnect
                setTimeout(initializeWebSocket, 5000);
            };
            
            websocket.onerror = function(error) {
                console.error('WebSocket error:', error);
            };
        }

        function handleWebSocketMessage(data) {
            switch(data.type) {
                case 'order_created':
                    updateLiveStats('orders', data.count);
                    break;
                case 'user_active':
                    updateLiveStats('users', data.count);
                    break;
                case 'revenue_updated':
                    updateLiveStats('revenue', data.amount);
                    break;
                case 'stock_low':
                    updateLiveStats('lowStock', data.count);
                    showAlert(`${data.count} products are low in stock`, 'warning');
                    break;
            }
        }

        function updateLiveStats(stat, value) {
            const elements = {
                orders: 'liveOrders',
                users: 'activeUsers',
                revenue: 'todayRevenue',
                lowStock: 'lowStock'
            };
            
            const element = document.getElementById(elements[stat]);
            if (element) {
                element.textContent = stat === 'revenue' ? `$${value.toLocaleString()}` : value;
            }
            
            // Update last updated time
            document.getElementById('lastUpdated').textContent = 'Just now';
        }

        function updateConnectionStatus(connected) {
            const statusElement = document.getElementById('connectionStatus');
            if (connected) {
                statusElement.classList.remove('disconnected');
                statusElement.classList.add('connected');
                statusElement.innerHTML = '<i class="fas fa-wifi"></i><span>Connected</span>';
            } else {
                statusElement.classList.remove('connected');
                statusElement.classList.add('disconnected');
                statusElement.innerHTML = '<i class="fas fa-wifi-slash"></i><span>Disconnected</span>';
            }
        }

        function exportDashboard() {
            // Create a comprehensive export
            const exportData = {
                timestamp: new Date().toISOString(),
                filters: activeFilters,
                kpis: getKPIValues(),
                charts: getChartData()
            };
            
            const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                type: 'application/json'
            });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `dashboard-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showAlert('Dashboard exported successfully', 'success');
        }

        function getKPIValues() {
            return {
                revenue: document.querySelector('.kpi-card.primary .kpi-value').textContent,
                orders: document.querySelector('.kpi-card.success .kpi-value').textContent,
                aov: document.querySelector('.kpi-card.warning .kpi-value').textContent,
                customers: document.querySelector('.kpi-card.info .kpi-value').textContent,
                abandonment: document.querySelector('.kpi-card.danger .kpi-value').textContent
            };
        }

        function getChartData() {
            // Extract data from charts
            return Object.keys(charts).reduce((data, key) => {
                if (charts[key] && charts[key].data) {
                    data[key] = {
                        labels: charts[key].data.labels,
                        datasets: charts[key].data.datasets.map(dataset => ({
                            label: dataset.label,
                            data: dataset.data
                        }))
                    };
                }
                return data;
            }, {});
        }

        function applyFilters() {
            // Collect filter values
            activeFilters = {
                startDate: document.getElementById('filterStartDate').value,
                endDate: document.getElementById('filterEndDate').value,
                categories: Array.from(document.getElementById('filterCategory').selectedOptions)
                    .map(option => option.value),
                priceRange: {
                    min: document.getElementById('priceMin').value,
                    max: document.getElementById('priceMax').value
                },
                region: document.getElementById('filterRegion').value,
                segment: document.getElementById('filterSegment').value,
                statuses: Array.from(document.getElementById('filterStatus').selectedOptions)
                    .map(option => option.value)
            };
            
            // Apply filters to all charts
            updateAllCharts();
            
            showAlert('Filters applied successfully', 'info');
        }

        function resetFilters() {
            // Reset all filter controls
            document.getElementById('filterStartDate').value = '';
            document.getElementById('filterEndDate').value = '';
            document.getElementById('filterCategory').selectedIndex = -1;
            document.getElementById('priceMin').value = 0;
            document.getElementById('priceMax').value = 5000;
            document.getElementById('filterRegion').value = 'all';
            document.getElementById('filterSegment').value = 'all';
            document.getElementById('filterStatus').selectedIndex = -1;
            
            // Update price labels
            document.getElementById('minPriceLabel').textContent = '0';
            document.getElementById('maxPriceLabel').textContent = '5000';
            
            // Clear active filters
            activeFilters = {};
            
            // Reset charts
            updateAllCharts();
            
            showAlert('Filters reset', 'info');
        }

        function updateAllCharts() {
            // Update each chart with filtered data
            if (charts.trend) updateTrendChart();
            if (charts.heatmap) updateHeatmap();
            if (charts.segmentation) updateSegmentationChart();
            if (charts.forecast) updateForecastChart();
            if (charts.budget) updateBudgetChart();
            
            // Update map
            updateRegionMap();
        }

        function refreshAllData() {
            showLoading();
            
            // Refresh all data sources
            Promise.all([
                fetch('/api/analytics/dashboard').then(r => r.json()),
                fetch('/api/analytics/products').then(r => r.json()),
                fetch('/api/analytics/orders').then(r => r.json())
            ])
            .then(([dashboard, products, orders]) => {
                updateDashboardData(dashboard);
                updateProductData(products);
                updateOrderData(orders);
                hideLoading();
                showAlert('Data refreshed successfully', 'success');
            })
            .catch(error => {
                hideLoading();
                console.error('Error refreshing data:', error);
                showAlert('Failed to refresh data', 'error');
            });
        }

        function showAlert(message, type = 'info') {
            const alertContainer = document.getElementById('alertContainer');
            const alert = document.createElement('div');
            alert.className = `alert alert-${type}`;
            alert.innerHTML = `
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
                <button class="alert-close" onclick="this.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            `;
            alertContainer.appendChild(alert);
            
            // Auto-remove after 5 seconds
            setTimeout(() => {
                if (alert.parentElement) {
                    alert.remove();
                }
            }, 5000);
        }

        function showLoading() {
            document.getElementById('loading').style.display = 'flex';
        }

        function hideLoading() {
            document.getElementById('loading').style.display = 'none';
        }

        function closeModal(modalId) {
            document.getElementById(modalId).style.display = 'none';
        }

        function logout() {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            showAlert('Logged out successfully', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        }

        // Helper functions
        function getColorForValue(value) {
            if (value > 70000) return '#10b981';
            if (value > 40000) return '#3b82f6';
            if (value > 20000) return '#f59e0b';
            return '#ef4444';
        }

        function countDuplicates(data) {
            const skus = data.map(row => row.SKU);
            const unique = new Set(skus);
            return skus.length - unique.size;
        }

        function loadMockProducts() {
            const mockProducts = [
                {
                    id: '1',
                    name: 'iPhone 15 Pro',
                    image: 'https://placehold.co/400x400/3b82f6/ffffff?text=iPhone',
                    category: 'phones',
                    brand: 'Apple',
                    price: 999.99,
                    discount: 899.99,
                    stock: 45,
                    maxStock: 100,
                    status: 'active',
                    sales: 124,
                    rating: 4.8
                },
                {
                    id: '2',
                    name: 'MacBook Pro 16"',
                    image: 'https://placehold.co/400x400/10b981/ffffff?text=MacBook',
                    category: 'laptops',
                    brand: 'Apple',
                    price: 2499.99,
                    stock: 22,
                    maxStock: 50,
                    status: 'active',
                    sales: 67,
                    rating: 4.9
                },
                {
                    id: '3',
                    name: 'Samsung Galaxy S24',
                    image: 'https://placehold.co/400x400/8b5cf6/ffffff?text=Galaxy',
                    category: 'phones',
                    brand: 'Samsung',
                    price: 899.99,
                    stock: 0,
                    maxStock: 75,
                    status: 'outofstock',
                    sales: 89,
                    rating: 4.7
                },
                {
                    id: '4',
                    name: 'Sony WH-1000XM5',
                    image: 'https://placehold.co/400x400/ef4444/ffffff?text=Sony',
                    category: 'audio',
                    brand: 'Sony',
                    price: 349.99,
                    discount: 299.99,
                    stock: 12,
                    maxStock: 50,
                    status: 'lowstock',
                    sales: 156,
                    rating: 4.6
                }
            ];
            
            renderProductGrid(mockProducts);
        }

        // Initialize with dashboard
        showSection('dashboard');
