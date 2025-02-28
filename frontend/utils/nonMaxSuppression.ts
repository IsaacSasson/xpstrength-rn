// Converts a box from [x, y, w, h] format to [x1, y1, x2, y2] format,
// where (x1, y1) is the top-left and (x2, y2) is the bottom-right.
function xywh2xyxy(x: number[]): number[] {
    const y: number[] = [];
    y[0] = x[0] - x[2] / 2; // top left x
    y[1] = x[1] - x[3] / 2; // top left y
    y[2] = x[0] + x[2] / 2; // bottom right x
    y[3] = x[1] + x[3] / 2; // bottom right y
    return y;
  }
  
  /**
   * Applies non-maximum suppression (NMS) to filter overlapping detections.
   *
   * @param res An array of detections. Each detection is an array of numbers where:
   *            indices [0,1,2,3] are box parameters in [x, y, w, h] format,
   *            index 4 is the object confidence score, and indices [5, ...] are class confidences.
   * @param conf_thresh Confidence threshold to filter boxes.
   * @param iou_thresh IoU threshold for suppression.
   * @param max_det Maximum number of detections to return (not used in this implementation).
   * @returns An array of selected detections, where each detection is an array:
   *          [x, y, w, h, score, class]
   */
  export function nonMaxSuppression(
    res: number[][],
    conf_thresh: number = 0.50,
    iou_thresh: number = 0.2,
    max_det: number = 300
  ): number[][] {
    const selectedDetections: number[][] = [];
  
    for (let i = 0; i < res.length; i++) {
      // Check if the box has sufficient confidence score.
      if (res[i][4] < conf_thresh) {
        continue;
      }
  
      const box: number[] = res[i].slice(0, 4);
      const clsDetections: number[] = res[i].slice(5);
      const klass: number = clsDetections.reduce(
        (imax, x, idx, arr) => (x > arr[imax] ? idx : imax),
        0
      );
      const score: number = res[i][klass + 5];
  
      const object: number[] = xywh2xyxy(box);
      let addBox: boolean = true;
  
      // Check for overlap with previously selected boxes.
      for (let j = 0; j < selectedDetections.length; j++) {
        // Extract only the [x, y, w, h] from the previously selected detection.
        const selectedBox = xywh2xyxy(selectedDetections[j].slice(0, 4));
  
        // Calculate the intersection and union of the two boxes.
        const intersectionXmin = Math.max(object[0], selectedBox[0]);
        const intersectionYmin = Math.max(object[1], selectedBox[1]);
        const intersectionXmax = Math.min(object[2], selectedBox[2]);
        const intersectionYmax = Math.min(object[3], selectedBox[3]);
        const intersectionWidth = Math.max(0, intersectionXmax - intersectionXmin);
        const intersectionHeight = Math.max(0, intersectionYmax - intersectionYmin);
        const intersectionArea = intersectionWidth * intersectionHeight;
        const boxArea = (object[2] - object[0]) * (object[3] - object[1]);
        const selectedBoxArea = (selectedBox[2] - selectedBox[0]) * (selectedBox[3] - selectedBox[1]);
        const unionArea = boxArea + selectedBoxArea - intersectionArea;
  
        // Calculate the IoU and check if the boxes overlap.
        const iou = intersectionArea / unionArea;
        if (iou >= iou_thresh) {
          addBox = false;
          break;
        }
      }
  
      // If the box passed the overlap check, add it to the list.
      if (addBox) {
        const row = box.concat(score, klass);
        selectedDetections.push(row);
      }
    }
  
    return selectedDetections;
  }  