import Board from "../Board/Board";
import Header from "../../common/Header/Header";
import SloganTyper from "../Solgan/Slogan1";
import Service from "../Service/Service";
import SloganTyper2 from "../Solgan/Slogan2";
import RoomsList from "../Room/Room";
import Reviews from "../Reviews/Reviews";
import Footer from "../../common/Footer/Footer";
import Items from "../Items/Items";
import GymPool from "../gymPool/GymPool";

const Home = () => {
  return (
    <div>
      <Header />

      <section id="home">
        <Board />
      </section>

      <section id="about">
        <SloganTyper />
      </section>

      <section id="services">
        <Service />
      </section>

      <section id="pool">
        <SloganTyper2 />
      </section>

      <section id="">
        <RoomsList />
      </section>
      <section id="items">
        <Items />
      </section>
      <section id="gym">
        <GymPool />
      </section>

      <section id="reviews">
        <Reviews />
      </section>

      <Footer />
    </div>
  );
};

export default Home;
