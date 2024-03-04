import { Index as ConfettiShower } from 'confetti-react'
import { ClientOnly } from 'remix-utils'
import { useState, useEffect } from 'react'

/**
 * confetti is a unique random identifier which re-renders the component
 */
export function Confetti({ confetti }: { confetti?: string }) {
	const { width, height } = useWindowSize()
	return (
		<ClientOnly>
			{() => (
				<ConfettiShower
					key={confetti}
					run={Boolean(confetti)}
					recycle={false}
					numberOfPieces={500}
					width={width}
					height={height}
				/>
			)}
		</ClientOnly>
	)
}

function useWindowSize() {
	interface Size {
		width: number | undefined
		height: number | undefined
	}
	const [size, setSize] = useState<Size>({
		width: undefined,
		height: undefined,
	})

	useEffect(() => {
		const handleResize = () => {
			setSize({
				width: window.innerWidth,
				height: window.innerHeight,
			})
		}

		handleResize()
		window.addEventListener('resize', handleResize)

		return () => {
			window.removeEventListener('resize', handleResize)
		}
	}, [])

	return size
}
