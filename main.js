/* =========================================
   MAIN SITE FUNCTIONALITY
   ========================================= */

// Smooth scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});

// Navbar scroll effect
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        navbar.style.boxShadow = window.scrollY > 50 ? '0 2px 20px rgba(0,0,0,0.1)' : '0 2px 10px rgba(0,0,0,0.05)';
    }
});

// Fade-in animations
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
    });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

// Mobile menu
const mobileMenu = document.querySelector('.mobile-menu');
const navLinks = document.querySelector('.nav-links');
if (mobileMenu && navLinks) {
    mobileMenu.addEventListener('click', () => {
        const isFlex = navLinks.style.display === 'flex';
        navLinks.style.display = isFlex ? 'none' : 'flex';
        if (!isFlex) {
            navLinks.style.position = 'absolute';
            navLinks.style.top = '100%';
            navLinks.style.left = '0';
            navLinks.style.right = '0';
            navLinks.style.background = 'white';
            navLinks.style.flexDirection = 'column';
            navLinks.style.padding = '2rem';
            navLinks.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
        }
    });
}

// Language selector
const langBtn = document.getElementById('siteLangBtn');
const langDropdown = document.getElementById('langDropdown');
if (langBtn && langDropdown) {
    langBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        langDropdown.classList.toggle('active');
    });

    document.addEventListener('click', () => langDropdown.classList.remove('active'));

    langDropdown.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.dataset.lang;
            document.getElementById('currentLang').textContent = lang.toUpperCase();
            changeSiteLanguage(lang);
            langDropdown.classList.remove('active');
        });
    });
}

// Site-wide language translation
const translations = {
    en: {
        'hero-badge': '✨ Trusted Care Since Day One',
        'hero-title': 'Safe & Gentle <span>Maternity Care</span> for Your Precious Moments',
        'hero-desc': 'Welcome to ERS Maternity & Pediatric Care Clinic in Trece Martires, Cavite. Compassionate care for mothers and children, with AI support in 4 languages.',
        'btn-book': 'Book Appointment →',
        'btn-call': 'Call Now',
        'services-tag': 'Our Services',
        'services-title': 'Comprehensive Care for Mother & Child',
        'gallery-tag': 'Gallery',
        'gallery-title': 'Our Clinic & Happy Families',
        'testi-tag': 'Testimonials',
        'testi-title': 'What Our Patients Say',
        'contact-tag': 'Get In Touch',
        'contact-title': 'Ready to Start Your Journey?'
    },
    tl: {
        'hero-badge': '✨ Mapagkatiwalaang Alaga Mula Sa Simula',
        'hero-title': 'Ligtas at Maamo na <span>Pangangalaga</span> para sa Inyong Mahahalagang Sandali',
        'hero-desc': 'Maligayang pagdating sa ERS Maternity & Pediatric Care Clinic sa Trece Martires, Cavite. Mapagmalasakit na alaga para sa mga ina at anak, na may AI support sa 4 na wika.',
        'btn-book': 'Mag-Book ng Appointment →',
        'btn-call': 'Tumawag Ngayon',
        'services-tag': 'Mga Serbisyo',
        'services-title': 'Komprehensibong Alaga para sa Ina at Anak',
        'gallery-tag': 'Gallery',
        'gallery-title': 'Ang Aming Klinika at Masasayang Pamilya',
        'testi-tag': 'Mga Testimonya',
        'testi-title': 'Sabi ng Aming mga Pasyente',
        'contact-tag': 'Makipag-ugnayan',
        'contact-title': 'Handa Na Bang Simulan ang Inyong Paglalakbay?'
    },
    ceb: {
        'hero-badge': '✨ Kasaligan nga Pag-atiman Suod pa Sa Sinugdanan',
        'hero-title': 'Luwas ug Malumo nga <span>Pag-atiman</span> para sa Inong Bililhon nga Mga Momento',
        'hero-desc': 'Welcome sa ERS Maternity & Pediatric Care Clinic sa Trece Martires, Cavite. Malasakon nga pag-atiman para sa mga inahan ug bata, uban sa AI support sa 4 ka lengguahe.',
        'btn-book': 'Mag-Book og Appointment →',
        'btn-call': 'Tawag Karon',
        'services-tag': 'Among Serbisyo',
        'services-title': 'Komprehensibo nga Pag-atiman para sa Inahan ug Bata',
        'gallery-tag': 'Gallery',
        'gallery-title': 'Among Klinika ug Malipayong Pamilya',
        'testi-tag': 'Mga Testimonya',
        'testi-title': 'Unsay Giingon sa Among mga Pasyente',
        'contact-tag': 'Kontaka Mi',
        'contact-title': 'Andam Na Ba nga Sugdan ang Inong Panaw?'
    },
    ilo: {
        'hero-badge': '✨ Matalek a Panangalaman Manipud Idi Rugi',
        'hero-title': 'Natalged ken Naalumamay a <span>Panangalaman</span> para iti Precioso a Kakaiyaranyo',
        'hero-desc': 'Naimbag a panawen iti ERS Maternity & Pediatric Care Clinic iti Trece Martires, Cavite. Naasi a panangalaman para kadagiti inna ken ubbing, addaan iti AI support iti 4 a pagsasao.',
        'btn-book': 'Ag-book iti Appointment →',
        'btn-call': 'Tumawag Ita',
        'services-tag': 'Serbisyo Mi',
        'services-title': 'Komprehensibo a Panangalaman para iti Inna ken Ubing',
        'gallery-tag': 'Gallery',
        'gallery-title': 'Klinika Mi ken Naragsak a Pamilia',
        'testi-tag': 'Testimonya',
        'testi-title': 'Kuna dagiti Pasyente Mi',
        'contact-tag': 'Kontaken Dakami',
        'contact-title': 'Nakaisagana Kadin a Rugian ti Panawyayo?'
    }
};

function changeSiteLanguage(lang) {
    const dict = translations[lang] || translations.en;
    document.querySelectorAll('[data-translate]').forEach(el => {
        const key = el.dataset.translate;
        if (dict[key]) {
            el.innerHTML = dict[key];
        }
    });
    localStorage.setItem('preferredLang', lang);
}

// Load saved language preference
const savedLang = localStorage.getItem('preferredLang');
if (savedLang) changeSiteLanguage(savedLang);

// Animated counter for stats
const statNumbers = document.querySelectorAll('.stat-number[data-count]');
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const target = parseInt(entry.target.dataset.count);
            let current = 0;
            const increment = target / 50;
            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    entry.target.textContent = target + '+';
                    clearInterval(timer);
                } else {
                    entry.target.textContent = Math.floor(current) + '+';
                }
            }, 30);
            statsObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

statNumbers.forEach(num => statsObserver.observe(num));

// Contact form submission
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(contactForm);
        const data = Object.fromEntries(formData);
        
        try {
            const response = await fetch(`${API_CONFIG.SUPABASE_URL}/rest/v1/contact_messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': API_CONFIG.SUPABASE_KEY,
                    'Authorization': `Bearer ${API_CONFIG.SUPABASE_KEY}`
                },
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                alert('✓ Message sent! We will contact you soon.');
                contactForm.reset();
            } else {
                throw new Error('Failed to send');
            }
        } catch (error) {
            alert('Please call us at +63 970 471 6507');
        }
    });
}

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW registration failed'));
}
