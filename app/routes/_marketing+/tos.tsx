import { type V2_MetaFunction } from '@remix-run/node'

export const meta: V2_MetaFunction = () => {
	return [
		{
			title: 'Terms of Service | thebarnaz.com',
		},
		{
			property: 'og:title',
			content: 'Terms of Service | thebarnaz.com',
		},
		{
			name: 'description',
			content:
				'Read our Terms of Service for thebarnaz.com, a nonprofit animal volunteer management system that connects volunteers with animal-assisted therapy organizations.',
		},
	]
}

export default function TermsOfServiceRoute() {
	return (
		<div className="container prose flex min-h-full flex-col justify-center pb-32 pt-20 dark:prose-invert">
			<h1>Terms of Service</h1>
			<p className="text-lg">
				By using our website and services, you agree to comply with the
				following terms and conditions:
			</p>
			<section>
				<h2>1. Acceptance of Terms</h2>
				<p>
					These terms of service govern your use of thebarnaz.com. By accessing
					or using our website, you acknowledge that you have read, understood,
					and agree to be bound by these terms.
				</p>
			</section>
			<section>
				<h2>2. Description of Services</h2>
				<p>
					thebarnaz.com is a nonprofit animal volunteer management system that connects
					volunteers with animal-assisted therapy organizations. Our services include
					providing a platform for volunteers to find and sign up for volunteer
					opportunities, and for organizations to manage their volunteer
					programs.
				</p>
			</section>
			<section>
				<h2>3. User Responsibilities</h2>
				<p>As a user of thebarnaz.com, you agree to:</p>
				<ul>
					<li>
						Provide accurate and complete information when creating an account
					</li>
					<li>
						Use the website and services in compliance with applicable laws and
						regulations
					</li>
					<li>Respect the privacy and rights of other users</li>
					<li>
						Not engage in any activity that may disrupt or interfere with the
						proper functioning of thebarnaz.com
					</li>
				</ul>
			</section>
			<section>
				<h2>4. Intellectual Property</h2>
				<p>
					All content and materials on thebarnaz.com, including but not limited
					to text, graphics, logos, images, and software, are the property of
					thebarnaz.com or its licensors and are protected by intellectual
					property laws. You may not reproduce, distribute, modify, or create
					derivative works of any content without prior written consent from
					thebarnaz.com.
				</p>
			</section>
			<section>
				<h2>5. Limitation of Liability</h2>
				<p>
					thebarnaz.com and its affiliates shall not be liable for any direct,
					indirect, incidental, special, or consequential damages arising out of
					or in connection with your use of the website or services.
				</p>
			</section>
			<section>
				<h2>6. Governing Law</h2>
				<p>
					These terms of service shall be governed by and construed in
					accordance with the laws of the jurisdiction in which thebarnaz.com
					operates.
				</p>
				<p>
					By using thebarnaz.com, you agree to these terms of service. If you do
					not agree with any part of these terms, please do not use our website
					or services.
				</p>
			</section>
		</div>
	)
}
