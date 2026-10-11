/** Shared public contact and service content. No integration credentials. */
export const CONTACT = {
  whatsapp: 'https://wa.me/971565015800',
  phone: 'tel:8006272886',
  phoneLabel: '800 627 2886',
  maps: 'https://maps.app.goo.gl/gj9EXG4uchRBtZcE6',
  address: '16 8 Street, Al Quoz Industrial 4, Dubai',
} as const;

export const SERVICES = [
  { title: 'Mechanical repair', detail: 'From a warning light to a complex engine repair. Start with a diagnosis you can understand.', image: '/images/mbr_mechanic.webp', alt: 'Mechanical work at MBR', number: '01' },
  { title: 'Electrical & diagnostics', detail: 'Find the cause behind the symptoms with specialist diagnostic equipment.', image: '/images/mbr_electrical.webp', alt: 'Vehicle electrical diagnostics at MBR', number: '02' },
  { title: 'Suspension & steering', detail: 'Restore the control, comfort and road feel your car was designed to deliver.', image: '/images/mbr_suspension.webp', alt: 'Suspension service at MBR', number: '03' },
  { title: 'Service & maintenance', detail: 'Keep the everyday drive exceptional with care tailored to your vehicle.', image: '/images/mbr_maintainence.webp', alt: 'Vehicle maintenance at MBR', number: '04' },
] as const;
