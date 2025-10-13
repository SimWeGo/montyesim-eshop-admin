import { Delete, Upload } from "@mui/icons-material";
import { FormHelperText, IconButton, Slider } from "@mui/material";
import { useRef, useState } from "react";
import AvatarEditor from "react-avatar-editor";
import Dropzone from "react-dropzone";
import MuiModal from "../../Modals/MuiModal";

const AvatarEditorComponent = ({ open, value, onClose, updateImage }) => {
  const [image, setImage] = useState(value);
  const [error, setError] = useState("");
  const [slideValue, setSlideValue] = useState(10);
  const cropRef = useRef(null);
  const handleDrop = (dropped) => {
    setImage(dropped[0]);
  };

  const handleSave = async () => {
    if (cropRef) {
      const dataUrl = cropRef?.current?.getImage().toDataURL();
      if (cropRef?.current) {
        const result = await fetch(dataUrl);
        const blob = await result.blob();
        setImage(URL.createObjectURL(blob));
        updateImage(blob);
        onClose();
      } else {
        setImage(null);
        updateImage(null);
        onClose();
      }
    }
  };

  const handleRemove = () => {
    setImage(null);
  };
  return (
    <MuiModal
      title={"Tag Icon"}
      open={true}
      onClose={onClose}
      onConfirm={() => handleSave()}
    >
      {!image ? (
        <div className={"flex flex-col gap-[0.5rem]"}>
          <Dropzone
            accept={{
              "image/png": [],
            }}
            maxSize={100 * 1024} //100kb
            onDropRejected={(fileRejections) =>
              fileRejections.forEach(({ file, errors }) => {
                errors.forEach((e) => {
                  if (e.code === "file-too-large") {
                    const sizeInKB = (file.size / 1024).toFixed(2);
                    const customError = {
                      ...e,
                      message: `File (${sizeInKB} KB) is larger than 100 KB`,
                    };
                    setError(customError);
                  } else {
                    setError(e);
                  }
                });
              })
            }
            onDrop={(acceptedFiles) => handleDrop(acceptedFiles)}
          >
            {({ getRootProps, getInputProps }) => (
              <section className="wfp--dropzone w-full bg-(--color-primary-50) cursor-pointer border rounded-xl border-dashed border-gray-200 w-[200px] h-[200px] justify-center items-center">
                <div
                  {...getRootProps({
                    className:
                      "wfp--dropzone__input flex justify-center items-center h-[100%]",
                  })}
                >
                  <input {...getInputProps()} />
                  <div>
                    <Upload fontSize="small" /> drag and drop
                  </div>
                </div>
              </section>
            )}
          </Dropzone>
          {error && <FormHelperText>{error?.message}</FormHelperText>}
        </div>
      ) : (
        <div className={"flex flex-col justify-center items-center gap-[1rem]"}>
          <AvatarEditor
            ref={cropRef}
            image={image}
            style={{ width: "100%", height: "100%" }}
            border={50}
            borderRadius={150}
            color={[0, 0, 0, 0.72]}
            scale={slideValue / 10}
            rotate={0}
          />
          <div
            className={
              "flex flex-row gap-[0.5rem] justify-between w-full items-center"
            }
          >
            <Slider
              min={2}
              max={50}
              sx={{
                margin: "0 auto",
                width: "80%",
              }}
              size="medium"
              defaultValue={slideValue}
              value={slideValue}
              onChange={(e) => setSlideValue(e.target.value)}
            />
            <IconButton onClick={() => handleRemove()}>
              <Delete />
            </IconButton>
          </div>
        </div>
      )}
    </MuiModal>
  );
};

export default AvatarEditorComponent;
