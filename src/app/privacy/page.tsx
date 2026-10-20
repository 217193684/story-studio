export const metadata = { title: "Privacy — Story Studio" };
/** Public privacy policy (needed for Google sign-in to YouTube). */
export default function Privacy() {
  return (
    <div className="panel" style={{ maxWidth: 720, margin: "0 auto", display: "grid", gap: 12 }}>
      <h1>Privacy policy</h1>
      <p className="muted">Story Studio · last updated 20 October 2026</p>
      <p>Story Studio is a private tool used by its owner, Mpumelelo Khumalo, to make videos for his own YouTube channel. It is not offered to the public.</p>
      <h3>What it accesses</h3>
      <p>When the owner connects a YouTube channel, Story Studio asks Google for permission to upload videos to that channel and to read the channel&apos;s name. It uses this only to upload videos the owner chooses to send, with the title, description and tags he sets.</p>
      <h3>What it stores</h3>
      <p>It stores the channel name and an encrypted Google sign-in token, so uploads can happen without signing in each time. It does not store or read your other YouTube data, Google account data, viewers&apos; data or anyone else&apos;s data, and it never sells or shares data.</p>
      <h3>Removing access</h3>
      <p>Tap Disconnect on the Calm videos page to delete the stored token, or remove Story Studio at myaccount.google.com/permissions at any time.</p>
      <p>Story Studio&apos;s use of information received from Google APIs follows the Google API Services User Data Policy, including the Limited Use requirements.</p>
      <h3>Contact</h3>
      <p>mpumelelokhumalo364@gmail.com</p>
    </div>
  );
}
