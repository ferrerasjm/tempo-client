import { Link, useNavigate } from "react-router-dom";
import { PageNavigation } from "../state/SessionNavigation";
import { artwork } from "../assets";
import { useCafe } from "../state/CafeContext";
import { CafeScene } from "../components/CafeScene";
import { EmptyState, LoadState, PageHeading } from "../components/ui";

export function LandingPage() {
  return (
    <section className="entrance gif-entrance">
      <Link
        className="entrance-art"
        to="/welcome"
        aria-label="Enter Cafe Tempo"
        data-tooltip="ready to lock in?"
      >
        <img
          src={artwork.entrance}
          width={1440}
          height={800}
          alt="An animated pixel-art cafe surrounded by greenery, with cats sitting by the entrance."
        />
      </Link>
      <h1 className="entrance-caption">cafe tempo</h1>
    </section>
  );
}

export function WelcomePage() {
  const cafe = useCafe();
  const navigate = useNavigate();
  return (
    <section className="page narrow welcome-page">
      <PageNavigation to="/" label="Back to Cafe Entrance" />
      <PageHeading
        eyebrow="Before you settle in"
        title="Welcome to Cafe Tempo"
        description="Slow down, settle in, and give one thing your attention."
      />
      <LoadState loading={cafe.loading} error={cafe.error} retry={cafe.retry}>
        {cafe.users.length === 0 ? (
          <EmptyState title="No profiles yet">
            Run the server seed command, then try again.
          </EmptyState>
        ) : (
          <div className="profile-list">
            {cafe.users.map((user) => (
              <button
                className="profile-choice"
                key={user._id}
                onClick={() => {
                  cafe.enter(user._id);
                  navigate("/study/drink");
                }}
              >
                <span className="avatar">{user.displayName.slice(0, 1)}</span>
                <span>
                  <strong>{user.displayName}</strong>
                  <small>{user.email}</small>
                </span>
                <span className="profile-choice-action">
                  <span>Continue</span>
                  <span aria-hidden="true">→</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </LoadState>
      {cafe.user && (
        <button
          className="text-link"
          onClick={() => {
            cafe.leave();
            cafe.notify("You left the profile.");
          }}
        >
          Leave Current Profile
        </button>
      )}
    </section>
  );
}

export function LobbyPage() {
  const { user } = useCafe();
  return (
    <section className="page lobby">
      <PageNavigation to="/welcome" label="Back to Profiles" preferSession />
      <PageHeading
        eyebrow={`Welcome, ${user?.displayName.split(" ")[0]}`}
        title="Make yourself at home."
        description="Start Focusing, or stop by the counter."
      />
      <CafeScene />
    </section>
  );
}
