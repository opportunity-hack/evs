import { Container, Html, Link, Tailwind, Text } from '@react-email/components'
import tailwindConfig from '../../../../tailwind.config.ts'
import { siteBaseUrl,  siteName } from '~/data.ts'

export function CustomEmail({ message }: { message: string }) {
	return (
		<Tailwind config={tailwindConfig}>
			<Html lang="en" dir="ltr">
				<Container style={{ backgroundColor: '#F8F8F8', padding: '20px', borderRadius: '5px' }}>
					<h1 style={{ color: '#333', fontSize: '24px', marginBottom: '20px' }}>
						<Text>A Message from {siteName}</Text>
					</h1>
					<p style={{ color: '#555', fontSize: '16px', marginBottom: '10px' }}>
						<Text>{message}</Text>
					</p>
					<p style={{ color: '#555', fontSize: '16px', marginBottom: '10px' }}>
						<Link href={siteBaseUrl + "/calendar"} style={{ color: '#007BFF', textDecoration: 'none' }}>
							View upcoming events
						</Link>
					</p>
				</Container>
			</Html>
		</Tailwind>
	)
}
