import { Container, Html, Link, Tailwind, Text } from '@react-email/components'
import tailwindConfig from '../../../../tailwind.config.ts'
import { siteBaseUrl } from '~/data.ts'

export function CustomEmail({ message }: { message: string }) {
	return (
		<Tailwind config={tailwindConfig}>
			<Html lang="en" dir="ltr">
				<Container>
					<h1>
						<Text>A Message from The Barn</Text>
					</h1>
					<p>
						<Text>{message}</Text>
					</p>
					<p>
						<Link href={siteBaseUrl}>View upcoming events</Link>
					</p>
				</Container>
			</Html>
		</Tailwind>
	)
}
