import heroImage from "../assets/images/herosection.jpg?url";

export default function Home() {
	return (
		<section className="hero-section" style={{ backgroundImage: `url(${heroImage})` }}>
			<div className="hero-copy">
				<p className="hero-kicker">Nepal Conservation Authority</p>
				<h1>Breath of the Himalayas</h1>
				<p className="hero-description">
					Exploring the vast, untamed beauty of Nepal's unique ecosystems from the tropical wetlands to the roof of the world.
				</p>

				<div className="hero-search-shell" role="presentation" aria-label="Search">
					<div className="hero-search-icon">⌕</div>
					<input
						type="text"
						placeholder="Search for species, parks, or initiatives..."
						aria-label="Search"
					/>
					<button type="button">Explore →</button>
				</div>
			</div>
		</section>
	);
}
