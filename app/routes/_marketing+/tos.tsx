import React from 'react';
import {
	type V2_MetaFunction
} from '@remix-run/node'

export const meta: V2_MetaFunction = () => {
	return [
		{ 
			title: "Terms of Service | TrotTrack.org",
		},
		{
			property: "og:title",
			content: "Terms of Service | TrotTrack.org",
		},
		{
			name: "description",
			content: "Read or Terms of Service for TrotTrack.org, a nonprofit equestrian volunteer system that connects volunteers with equestrian organizations.",
		},
	];
};

export default function TermsOfServiceRoute() {
	return (
		<div className="container flex min-h-full flex-col justify-center pb-32 pt-20">			
			<div className="mx-auto w-full max-w-lg">
				<h1 className="text-2xl font-bold">Terms of Service</h1>				
			</div>
			<p className="text-lg">By using our website and services, you agree to comply with the following terms and conditions:</p>
			<section>
				<h2 className="text-xl font-bold">1. Acceptance of Terms</h2>
				<p>These terms of service govern your use of TrotTrack.org. By accessing or using our website, you acknowledge that you have read, understood, and agree to be bound by these terms.</p>
			</section>
			<section>
				<h2 className="text-xl font-bold">2. Description of Services</h2>
				<p>TrotTrack.org is a nonprofit equestrian volunteer system that connects volunteers with equestrian organizations. Our services include providing a platform for volunteers to find and sign up for volunteer opportunities, and for organizations to manage their volunteer programs.</p>
			</section>
			<section>
				<h2 className="text-xl font-bold">3. User Responsibilities</h2>
				<p>As a user of TrotTrack.org, you agree to:</p>
				<ul>
					<li>Provide accurate and complete information when creating an account</li>
					<li>Use the website and services in compliance with applicable laws and regulations</li>
					<li>Respect the privacy and rights of other users</li>
					<li>Not engage in any activity that may disrupt or interfere with the proper functioning of TrotTrack.org</li>
				</ul>
			</section>
			<section>
				<h2 className="text-xl font-bold">4. Intellectual Property</h2>
				<p>All content and materials on TrotTrack.org, including but not limited to text, graphics, logos, images, and software, are the property of TrotTrack.org or its licensors and are protected by intellectual property laws. You may not reproduce, distribute, modify, or create derivative works of any content without prior written consent from TrotTrack.org.</p>
			</section>
			<section>
				<h2 className="text-xl font-bold">5. Limitation of Liability</h2>
				<p>TrotTrack.org and its affiliates shall not be liable for any direct, indirect, incidental, special, or consequential damages arising out of or in connection with your use of the website or services.</p>
			</section>
			<section>
				<h2 className="text-xl font-bold">6. Governing Law</h2>
				<p>These terms of service shall be governed by and construed in accordance with the laws of the jurisdiction in which TrotTrack.org operates.</p>
				<p>By using TrotTrack.org, you agree to these terms of service. If you do not agree with any part of these terms, please do not use our website or services.</p>
			</section>
		</div>
	);
}

