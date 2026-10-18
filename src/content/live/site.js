export function patchSite(document,site) {
  const number=site.phone.replace(/\D/g,'');
  document.documentElement.dataset.contactNumber=number;
  for (const link of document.querySelectorAll('a[href^="tel:"]')) {
    link.setAttribute('href',`tel:${site.phone}`);
    if(link.matches('.contact-phone')) {
      const arrow=link.querySelector('span');
      link.replaceChildren(document.createTextNode(site.phone),...(arrow?[arrow]:[]));
    }
  }
  for (const address of document.querySelectorAll('.footer address, .contact address, [data-contact-address]')) address.textContent=site.address;
  for (const link of document.querySelectorAll('a[href^="https://www.instagram.com/"]')) link.setAttribute('href',site.instagram);
  for (const link of document.querySelectorAll('a[href^="https://wa.me/"]')) {
    const url=new URL(link.getAttribute('href'));url.pathname=`/${number}`;link.setAttribute('href',url.href);
  }
  const footer=document.querySelector('.footer-bottom>p:first-child');if(footer)footer.textContent=site.footerText;
}
