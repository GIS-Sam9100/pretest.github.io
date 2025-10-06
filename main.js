document.addEventListener('DOMContentLoaded', () => {
    const apiUrl = 'https://asia-southeast2-personalsmz.cloudfunctions.net/ProjectSmZ/lokasi'; // Sesuaikan jika port berbeda
    
    // Inisialisasi Peta Leaflet
    const map = L.map('map').setView([-6.200000, 106.816666], 12); // Default: Jakarta
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    const form = document.getElementById('lokasi-form');
    const lokasiIdInput = document.getElementById('lokasi-id');
    const namaInput = document.getElementById('nama');
    const kategoriInput = document.getElementById('kategori');
    const deskripsiInput = document.getElementById('deskripsi');
    const longitudeInput = document.getElementById('longitude');
    const latitudeInput = document.getElementById('latitude');
    const submitBtn = document.getElementById('submit-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const lokasiList = document.getElementById('lokasi-list');

    let markers = {}; // Objek untuk menyimpan marker berdasarkan ID

    // Fungsi untuk mengambil semua lokasi dan menampilkannya
    const fetchLokasi = async () => {
        try {
            const response = await fetch(apiUrl);
            const lokasis = await response.json() || [];
            
            // Bersihkan peta dan daftar
            lokasiList.innerHTML = '';
            Object.values(markers).forEach(marker => map.removeLayer(marker));
            markers = {};

            lokasis.forEach(lokasi => {
                addLokasiToList(lokasi);
                addMarkerToMap(lokasi);
            });
        } catch (error) {
            console.error('Gagal mengambil data:', error);
        }
    };

    // Menambahkan lokasi ke daftar list
    const addLokasiToList = (lokasi) => {
        const li = document.createElement('li');
        li.dataset.id = lokasi._id;
        li.innerHTML = `
            <div class="list-item-info">
                <strong>${lokasi.nama}</strong>
                <span>${lokasi.kategori}</span>
            </div>
            <div class="action-buttons">
                <button class="edit-btn" title="Edit">✏️</button>
                <button class="delete-btn" title="Hapus">🗑️</button>
            </div>
        `;
        lokasiList.appendChild(li);
    };

    // Menambahkan marker ke peta
    const addMarkerToMap = (lokasi) => {
        const [longitude, latitude] = lokasi.koordinat.coordinates;
        const marker = L.marker([latitude, longitude])
            .addTo(map)
            .bindPopup(`<b>${lokasi.nama}</b><br>${lokasi.deskripsi}`);
        
        markers[lokasi._id] = marker;
    };

    // Reset form ke keadaan awal
    const resetForm = () => {
        form.reset();
        lokasiIdInput.value = '';
        submitBtn.textContent = 'Tambah Lokasi';
        cancelBtn.classList.add('hidden');
    };

    // Mengisi form untuk mode edit
    const fillFormForEdit = (lokasi) => {
        lokasiIdInput.value = lokasi._id;
        namaInput.value = lokasi.nama;
        kategoriInput.value = lokasi.kategori;
        deskripsiInput.value = lokasi.deskripsi;
        longitudeInput.value = lokasi.koordinat.coordinates[0];
        latitudeInput.value = lokasi.koordinat.coordinates[1];
        submitBtn.textContent = 'Update Lokasi';
        cancelBtn.classList.remove('hidden');
    };

    // Event: Klik pada peta untuk mengisi koordinat
    map.on('click', (e) => {
        longitudeInput.value = e.latlng.lng.toFixed(6);
        latitudeInput.value = e.latlng.lat.toFixed(6);
    });

    // Event: Submit form (Create/Update)
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = lokasiIdInput.value;
        const data = {
            nama: namaInput.value,
            kategori: kategoriInput.value,
            deskripsi: deskripsiInput.value,
            koordinat: {
                type: 'Point',
                coordinates: [
                    parseFloat(longitudeInput.value),
                    parseFloat(latitudeInput.value)
                ]
            }
        };

        const method = id ? 'PUT' : 'POST';
        const url = id ? `${apiUrl}?id=${id}` : apiUrl;

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('Operasi gagal');
            resetForm();
            fetchLokasi();
        } catch (error) {
            console.error('Error:', error);
            alert('Gagal menyimpan data.');
        }
    });

    // Event: Klik pada daftar lokasi (Edit, Delete, atau Pan to map)
    lokasiList.addEventListener('click', async (e) => {
        const li = e.target.closest('li');
        const id = li.dataset.id;

        if (e.target.classList.contains('delete-btn')) {
            if (confirm('Yakin ingin menghapus lokasi ini?')) {
                try {
                    const response = await fetch(`${apiUrl}?id=${id}`, { method: 'DELETE' });
                    if (!response.ok) throw new Error('Gagal menghapus');
                    fetchLokasi();
                } catch (error) {
                    console.error('Error:', error);
                    alert('Gagal menghapus lokasi.');
                }
            }
        } else if (e.target.classList.contains('edit-btn')) {
            const response = await fetch(`${apiUrl}?id=${id}`);
            const lokasi = await response.json();
            fillFormForEdit(lokasi);
        } else {
            // Pan to marker on map
            if (markers[id]) {
                map.flyTo(markers[id].getLatLng(), 15);
                markers[id].openPopup();
            }
        }
    });
    
    // Event: Tombol batal
    cancelBtn.addEventListener('click', resetForm);

    // Muat data awal
    fetchLokasi();
});
