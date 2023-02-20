import { Button, Grid, makeStyles, MenuItem, Select } from "@material-ui/core";
import { Loader } from "google-maps";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import { getCurrentPosition } from "../util/geolocation";
import { makeCarIcon, makeMarkerIcon, Map } from "../util/map";
import { Route } from "../util/models";
import { sample, shuffle } from "lodash";
import { useSnackbar } from "notistack";
import { RouteExistsError } from "../errors/route-exists.error";
import Navbar from "./Navbar";

const API_URL = process.env.REACT_APP_API_URL as string;

const googleMapsLoader = new Loader(process.env.REACT_APP_GOOGLE_API_KEY);

const colors = [
  "#b71c1c",
  "#4a148c",
  "#2e7d32",
  "#e65100",
  "#2962ff",
  "#c2185b",
  "#FFCD00",
  "#3e2723",
  "#03a9f4",
  "#827717",
];

const useStyles = makeStyles({
  root: {
    width: "100%",
    height: "100%",
  },
  form: {
    margin: "16px",
  },
  btnSubmitWrapper: {
    textAlign: "center",
    marginTop: "8px",
  },
  map: {
    width: "100%",
    height: "100%",
  },
});

export default function Mapping() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [routeIdSelected, setRouteIdSelected] = useState<string>("");
  const mapRef = useRef<Map>();
  const socketIORef = useRef<SocketIOClient.Socket>();
  const { enqueueSnackbar } = useSnackbar();
  const classes = useStyles();

  const finishRoute = useCallback(
    (route: Route) => {
      enqueueSnackbar(`${route.title} finalizou`, { variant: "success" });
      mapRef.current?.removeRoute(route._id);
    },
    [enqueueSnackbar]
  );

  useEffect(() => {
    if (!socketIORef.current?.connected) {
      socketIORef.current = io.connect(API_URL);
      socketIORef.current.on("connect", () => {
        console.log("connected");
      });
    }

    const handler = (data: {
      routeId: string;
      position: [number, number];
      finished: boolean;
    }) => {
      mapRef.current?.moveCurrentMarker(data.routeId, {
        lat: data.position[0],
        lng: data.position[1],
      });
      const route = routes.find((route) => route._id === data.routeId) as Route;
      if (data.finished) {
        finishRoute(route);
      }
    };

    socketIORef.current?.on("new-position", handler);

    return () => {
      socketIORef.current?.off("new-position", handler);
    };
  }, [routeIdSelected, finishRoute, routes]);

  useEffect(() => {
    fetch(`${API_URL}/routes`)
      .then((data) => data.json())
      .then((data) => setRoutes(data));
  }, []);

  useEffect(() => {
    (async () => {
      const [, position] = await Promise.all([
        googleMapsLoader.load(),
        getCurrentPosition({ enableHighAccuracy: true }),
      ]);
      const divMap = document.getElementById("map") as HTMLElement;
      mapRef.current = new Map(divMap, {
        zoom: 15,
        center: position,
      });
    })();
  }, []);

  const startRoute = useCallback(
    (event: FormEvent) => {
      event.preventDefault();
      const route = routes.find((route) => route._id === routeIdSelected);
      const color = sample(shuffle(colors));
      try {
        mapRef.current?.addRoute(routeIdSelected, {
          currentMarkerOptions: {
            position: route?.startPosition,
            icon: makeCarIcon(color as string),
          },
          endMarkerOptions: {
            position: route?.endPosition,
            icon: makeMarkerIcon(color as string),
          },
        });
        socketIORef.current?.emit("new-direction", {
          routeId: routeIdSelected,
        });
      } catch (error) {
        if (error instanceof RouteExistsError) {
          enqueueSnackbar(`${route?.title} já adicionado, espere finalizar`, {
            variant: "error",
          });
        }
      }
    },
    [routeIdSelected, routes, enqueueSnackbar]
  );

  return (
    <Grid container className={classes.root}>
      <Grid item xs={12} sm={3}>
        <Navbar />
        <form onSubmit={startRoute} className={classes.form}>
          <Select
            fullWidth
            displayEmpty
            value={routeIdSelected}
            onChange={(event) => setRouteIdSelected(String(event.target.value))}
          >
            <MenuItem value="">Selecione uma corrida</MenuItem>
            {routes.map((route) => (
              <MenuItem key={route._id} value={route._id}>
                {route.title}
              </MenuItem>
            ))}
          </Select>
          <div className={classes.btnSubmitWrapper}>
            <Button type="submit" color="primary" variant="contained">
              Iniciar uma corrida
            </Button>
          </div>
        </form>
      </Grid>
      <Grid item xs={12} sm={9}>
        <div id="map" className={classes.map}></div>
      </Grid>
    </Grid>
  );
}
