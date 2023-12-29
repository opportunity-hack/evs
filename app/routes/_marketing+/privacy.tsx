import {
	type V2_MetaFunction
} from '@remix-run/node'

export const meta: V2_MetaFunction = () => {
	return [
		{ 
			title: "Privacy Policy | TrotTrack.org",
		},
		{
			property: "og:title",
			content: "Privacy Policy | TrotTrack.org",
		},
		{
			name: "description",
			content: "Read our Privacy Policy for TrotTrack.org, a nonprofit equestrian volunteer system that connects volunteers with equestrian organizations.",
		},
	];
};

export default function PrivacyRoute() {
	return (
		<div className="container flex min-h-full flex-col justify-center pb-32 pt-20">			
			<div className="mx-auto w-full max-w-lg">
				<h1 className="text-2xl font-bold">Privacy Policy</h1>				
			</div>
			<p className="text-lg">By using our website and services, you agree to comply with the following privacy policy:</p>
			<section>
				<h2 className="text-xl font-bold">1. Information Collection</h2>
				<p>We collect certain information when you use our website and services. This may include personal information such as your name, email address, and other contact details. We also collect non-personal information such as your IP address and browsing behavior.</p>
			</section>
			<section>
				<h2 className="text-xl font-bold">2. Use of Information</h2>
				<p>We use the information we collect to provide and improve our website and services. We may use your personal information to communicate with you, respond to your inquiries, and send you relevant updates and notifications.</p>
			</section>
			<section>
				<h2 className="text-xl font-bold">3. Information Sharing</h2>
				<p>We may share your information with third-party service providers who assist us in operating our website and services. We may also share your information when required by law or to protect our rights and interests.</p>
			</section>
			<section>
				<h2 className="text-xl font-bold">4. Data Security</h2>
				<p>We take reasonable measures to protect the security of your information. However, please note that no method of transmission over the internet or electronic storage is completely secure.</p>
			</section>
			<section>
				<h2 className="text-xl font-bold">5. Cookies</h2>
				<p>We use cookies to enhance your browsing experience and provide personalized content. You can choose to disable cookies in your browser settings, but please note that some features of our website may not function properly.</p>
			</section>
			<section>
				<h2 className="text-xl font-bold">6. Changes to this Privacy Policy</h2>
				<p>We may update this privacy policy from time to time. Any changes will be posted on this page, and the revised policy will be effective immediately upon posting.</p>
				<p>By using our website and services, you agree to this privacy policy. If you do not agree with any part of this policy, please do not use our website or services.</p>
			</section>
		</div>
	);
}

