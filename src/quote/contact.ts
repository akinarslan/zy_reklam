import { brand } from '../config/brand';

export function setupContact(): () => void {
  const form = document.querySelector<HTMLFormElement>('[data-contact-form]');
  const status = document.querySelector<HTMLElement>('[data-contact-status]');
  const copyButton = document.querySelector<HTMLButtonElement>('[data-copy-message]');
  if (!form) return () => {};
  const message = () => {
    const data = new FormData(form);
    const name = String(data.get('name') ?? '').trim();
    const phone = String(data.get('phone') ?? '').trim();
    const note = String(data.get('message') ?? '').trim();
    return ['Merhaba ZY REKLAM,', `Ad: ${name}`, phone ? `Telefon: ${phone}` : '', `Mesaj: ${note}`].filter(Boolean).join('\n');
  };
  const validate = () => {
    const name = form.elements.namedItem('name') as HTMLInputElement;
    const note = form.elements.namedItem('message') as HTMLTextAreaElement;
    name.setCustomValidity(name.value.trim() ? '' : 'Adınızı yazın.');
    note.setCustomValidity(note.value.trim() ? '' : 'Projenizi kısaca anlatın.');
    return form.reportValidity();
  };
  const clearErrors = () => {
    for (const element of Array.from(form.elements)) {
      if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) element.setCustomValidity('');
    }
  };
  const submit = (event: SubmitEvent) => {
    event.preventDefault();
    if (!validate()) return;
    window.open(`https://wa.me/${brand.whatsappNumber}?text=${encodeURIComponent(message())}`, '_blank', 'noopener,noreferrer');
    if (status) status.textContent = 'Mesajı WhatsApp’ta kontrol edip gönderebilirsiniz. Açılmazsa metni kopyalayın veya bizi arayın.';
  };
  const copy = async () => {
    if (!validate()) return;
    try {
      await navigator.clipboard.writeText(message());
      if (status) status.textContent = 'Mesaj kopyalandı. WhatsApp görüşmenize yapıştırabilirsiniz.';
    } catch {
      if (status) status.textContent = 'Kopyalama izni verilmedi. Mesajınızı seçip kopyalayabilir veya bizi arayabilirsiniz.';
    }
  };
  form.addEventListener('submit', submit);
  form.addEventListener('input', clearErrors);
  copyButton?.addEventListener('click', copy);
  return () => {
    form.removeEventListener('submit', submit);
    form.removeEventListener('input', clearErrors);
    copyButton?.removeEventListener('click', copy);
  };
}
