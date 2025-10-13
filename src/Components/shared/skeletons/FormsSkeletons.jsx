import { Card, CardContent, Skeleton } from "@mui/material";

const FormsSkeletons = () => {
  return (
    <Card>
      <CardContent className={"flex flex-col p-6 gap-[1rem]"}>
        <div className={"flex flex-wrap gap-[1rem] "}>
          {Array(3)
            .fill()
            .map((_, index) => (
              <Skeleton
                key={index} // NOSONAR
                variant="rectangular"
                height={50}
                width="100%"
                className={"flex-1"}
              />
            ))}
        </div>

        <div className={"flex flex-wrap gap-[1rem] w-[70%]"}>
          {Array(2)
            .fill()
            .map((_, index) => (
              <Skeleton
                key={index} // NOSONAR
                variant="rectangular"
                height={50}
                width="100%"
                className={"flex-1"}
              />
            ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default FormsSkeletons;
