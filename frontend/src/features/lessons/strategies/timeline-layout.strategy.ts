import { TimelineOrientation } from '../types/block-builder.types';

export interface ITimelineOrientationOption {
  orientation: TimelineOrientation;
  label: string;
  icon: string;
  description: string;
  containerClass: string;
  nodeCardClass: string;
  nodeDotClass: string;
}

export class TimelineLayoutStrategy {
  private static readonly ORIENTATIONS: Record<TimelineOrientation, ITimelineOrientationOption> = {
    [TimelineOrientation.VERTICAL]: {
      orientation: TimelineOrientation.VERTICAL,
      label: 'Dọc (Mặc định)',
      icon: '↕',
      description: 'Trục dọc truyền thống, thích hợp đọc chi tiết từ trên xuống',
      containerClass: 'relative pl-6 sm:pl-8 border-l-2 border-blue-200 ml-3 sm:ml-4 space-y-4 my-3',
      nodeCardClass: 'relative group/node bg-slate-50/80 hover:bg-white border border-slate-200/90 rounded-xl p-4 transition shadow-2xs hover:shadow-xs',
      nodeDotClass: 'absolute -left-[31px] sm:-left-[39px] top-4 w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white ring-2 ring-blue-300',
    },
    [TimelineOrientation.HORIZONTAL]: {
      orientation: TimelineOrientation.HORIZONTAL,
      label: 'Ngang (Cuộn)',
      icon: '↔',
      description: 'Trục ngang trải rộng, cuộn từ trái sang phải xem toàn cảnh niên biểu',
      containerClass: 'relative overflow-x-auto flex flex-row gap-4 pt-6 pb-4 px-2 scrollbar-thin scrollbar-thumb-blue-200 border-t-2 border-blue-200 mt-6',
      nodeCardClass: 'relative group/node bg-slate-50/80 hover:bg-white border border-slate-200/90 rounded-xl p-4 transition shadow-2xs hover:shadow-xs min-w-[300px] max-w-[340px] shrink-0',
      nodeDotClass: 'absolute left-6 -top-[31px] w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white ring-2 ring-blue-300',
    },
  };

  public static getOption(orientation: TimelineOrientation = TimelineOrientation.VERTICAL): ITimelineOrientationOption {
    return this.ORIENTATIONS[orientation] || this.ORIENTATIONS[TimelineOrientation.VERTICAL];
  }

  public static isHorizontal(orientation?: TimelineOrientation): boolean {
    return orientation === TimelineOrientation.HORIZONTAL;
  }
}
