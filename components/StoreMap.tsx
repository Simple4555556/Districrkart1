import { MapPin, Clock, Phone } from "lucide-react";

export default function StoreMap() {
  return (
    <section className="store-map-section" id="store-map">
      <div className="container container-wide">
        <div className="section-header">
          <span className="text-overline">Find Us</span>
          <h2 className="text-h2">Visit Our Store</h2>
          <p className="text-body">Come see us in person or reach out anytime</p>
        </div>

        <div className="store-map-grid">
          <div className="store-map-info">
            <div className="store-map-item">
              <div className="store-map-icon"><MapPin size={22} /></div>
              <div>
                <h3>Address</h3>
                <p>Hospital Chowk, Tajpur<br />Bihari Store</p>
              </div>
            </div>
            <div className="store-map-item">
              <div className="store-map-icon"><Clock size={22} /></div>
              <div>
                <h3>Store Hours</h3>
                <p>Open: 9:00 AM – 7:00 PM<br />Open all days</p>
              </div>
            </div>
            <div className="store-map-item">
              <div className="store-map-icon"><Phone size={22} /></div>
              <div>
                <h3>Contact</h3>
                <p>+91 91427 17690<br />biharistore@gmail.com</p>
              </div>
            </div>
            <a
              href="https://wa.me/919142717690"
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary"
              style={{ alignSelf: 'flex-start', background: '#25D366', marginTop: 8 }}
            >
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 0C5.385 0 0 5.388 0 12.035c0 2.124.553 4.195 1.604 6.01L.062 24l6.115-1.558A11.956 11.956 0 0012.031 24c6.643 0 12.03-5.388 12.03-12.035S18.674 0 12.031 0z"/></svg>
              Chat on WhatsApp
            </a>
          </div>

          <div className="store-map-iframe">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1m2!1s0x39edc51f40000000%3A0x6d9f36f9a0cfa51b!2sHospital%20Chowk!5e0!3m2!1sen!2sin!4v1680000000000!5m2!1sen!2sin"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={true}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Hospital Chowk, Tajpur Map"
            ></iframe>
          </div>
        </div>
      </div>
    </section>
  );
}
