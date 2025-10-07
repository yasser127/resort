import Board from "../Board/Board"
import Header from "../../common/Header/Header";
import SloganTyper from "../Solgan/Slogan1";
import Service from "../Service/Service";
import SloganTyper2 from "../Solgan/Slogan2";
import RoomsList from "../Room/Room";
import Reviews from "../Reviews/Reviews";
import Footer from "../../common/Footer/Footer";
import Items from "../Items/Items";

const Home = () => {
  return (
    <div>
      <Header />
      <Board />
      <SloganTyper />
      <Service />
      <SloganTyper2 />
      <RoomsList/>
      <Reviews />
      <Items />
      <Footer />
    </div>
  );
};

export default Home;
