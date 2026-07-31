/* =========================================
   IMAGE GALLERY WITH LIGHTBOX
   ========================================= */

class ImageGallery {
    constructor() {
        this.images = [
            { src: 'images/clinic-exterior.jpg', alt: 'Clinic Exterior', caption: 'Our welcoming clinic' },
            { src: 'images/reception.jpg', alt: 'Reception Area', caption: 'Comfortable reception' },
            { src: 'images/birthing-room.jpg', alt: 'Birthing Room', caption: 'Modern birthing room' },
            { src: 'images/pediatric.jpg', alt: 'Pediatric Area', caption: 'Child-friendly area' },
            { src: 'images/doctor-castillo.jpg', alt: 'Dr. Castillo', caption: 'Dr. Evalyn Rivera-Castillo' },
            { src: 'images/doctor-sinsay.jpg', alt: 'Dr. Sinsay', caption: 'Dr. Elli Sinsay' },
            { src: 'images/happy-mom.jpg', alt: 'Happy Mom', caption: 'Happy mothers' },
            { src: 'images/newborn.jpg', alt: 'Newborn', caption: 'Precious newborns' }
        ];
        this.init();
    }

    init() {
        const grid = document.getElementById('galleryGrid');
        if (!grid) return;

        grid.innerHTML = this.images.map((img, i) => `
            <div class="gallery-item" data-index="${i}">
                <img src="${img.src}" alt="${img.alt}" loading="lazy" 
                     onerror="this.src='https://via.placeholder.com/400x400/F8BBD0/E91E63?text=${encodeURIComponent(img.alt)}'">
                <div class="gallery-overlay">
                    <div>
                        <h4>${img.caption}</h4>
                    </div>
                </div>
            </div>
        `).join('');

        this.createLightbox();
        this.attachEvents();
    }

    createLightbox() {
        const lightbox = document.createElement('div');
        lightbox.className = 'lightbox';
        lightbox.id = 'lightbox';
        lightbox.innerHTML = `
            <button class="lightbox-close" id="lightboxClose">×</button>
            <img id="lightboxImg" src="" alt="">
        `;
        document.body.appendChild(lightbox);
    }

    attachEvents() {
        document.querySelectorAll('.gallery-item').forEach(item => {
            item.addEventListener('click', () => {
                const index = parseInt(item.dataset.index);
                this.openLightbox(index);
            });
        });

        const close = document.getElementById('lightboxClose');
        if (close) close.addEventListener('click', () => this.closeLightbox());

        document.getElementById('lightbox').addEventListener('click', (e) => {
            if (e.target.id === 'lightbox') this.closeLightbox();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeLightbox();
        });
    }

    openLightbox(index) {
        const lightbox = document.getElementById('lightbox');
        const img = document.getElementById('lightboxImg');
        img.src = this.images[index].src;
        img.alt = this.images[index].alt;
        lightbox.classList.add('active');
    }

    closeLightbox() {
        document.getElementById('lightbox').classList.remove('active');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('galleryGrid')) {
        new ImageGallery();
    }
});