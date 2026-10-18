// Share the actual home links, including their accessible names and safe targets.
export function publicSocialLinks(home) {
  return ['instagram-float','whatsapp-float'].map(name=>{
    const link=home.match(new RegExp(`<a class="${name}"[\\s\\S]*?<\\/a>`));
    if(!link)throw new Error(`Missing public social link: ${name}`);
    return link[0];
  }).join('\n');
}
